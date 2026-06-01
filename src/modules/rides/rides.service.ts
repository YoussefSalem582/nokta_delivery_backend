import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RideStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MessageKeys } from '../../common/messages/message-keys';
import { buildErrorResponse, buildResponse } from '../../common/responses/api-response';
import {
  fromTripStatus,
  toTripJson,
  toTripStatus,
} from '../../common/mappers/status.mapper';
import { EstimateFareDto, RequestRideDto, UpdateRideStatusDto } from './dto/ride.dto';

const BASE_FARE = 15;
const PER_KM_RATE = 8;

@Injectable()
export class RidesService {
  constructor(private readonly prisma: PrismaService) {}

  private rideInclude = {
    rider: { select: { id: true, name: true, phone: true, avatarUrl: true } },
    driver: {
      select: {
        id: true,
        name: true,
        phone: true,
        avatarUrl: true,
        driverProfile: {
          select: {
            rating: true,
            vehicle: { select: { makeModel: true, vehicleType: true } },
          },
        },
      },
    },
  } as const;

  async findAllForUser(userId: string, role: string) {
    const where =
      role === 'DRIVER' || role === 'COURIER'
        ? { OR: [{ riderId: userId }, { driverId: userId }] }
        : { riderId: userId };

    const rides = await this.prisma.ride.findMany({
      where,
      include: this.rideInclude,
      orderBy: { createdAt: 'desc' },
    });

    return rides.map(toTripJson);
  }

  async findById(id: string, userId: string) {
    const ride = await this.getRideOrThrow(id);
    this.assertRideAccess(ride, userId);
    return toTripJson(ride);
  }

  async requestRide(userId: string, dto: RequestRideDto) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.ride.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: this.rideInclude,
      });
      if (existing) {
        return toTripJson(existing);
      }
    }

    const estimate = this.calculateFare(
      dto.pickupLat,
      dto.pickupLng,
      dto.dropoffLat,
      dto.dropoffLng,
    );

    const ride = await this.prisma.ride.create({
      data: {
        riderId: dto.riderId ?? userId,
        pickupAddress: dto.pickupAddress,
        dropoffAddress: dto.dropoffAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        fare: dto.fare ?? estimate.fare,
        distanceKm: dto.distanceKm ?? estimate.distanceKm,
        etaMinutes: dto.etaMinutes ?? estimate.etaMinutes,
        paymentMethodKey: dto.paymentMethodKey,
        rideTierKey: dto.rideTierKey,
        idempotencyKey: dto.idempotencyKey,
        events: { create: { status: RideStatus.REQUESTED } },
      },
      include: this.rideInclude,
    });

    return toTripJson(ride);
  }

  async updateStatus(id: string, userId: string, dto: UpdateRideStatusDto) {
    const ride = await this.getRideOrThrow(id);
    this.assertRideAccess(ride, userId);

    const nextStatus = fromTripStatus(dto.status);
    this.validateTransition(ride.status, nextStatus);

    const updated = await this.prisma.ride.update({
      where: { id },
      data: {
        status: nextStatus,
        events: { create: { status: nextStatus } },
      },
      include: this.rideInclude,
    });

    return toTripJson(updated);
  }

  async getActiveRide(userId: string) {
    const ride = await this.prisma.ride.findFirst({
      where: {
        OR: [{ riderId: userId }, { driverId: userId }],
        status: {
          in: [
            RideStatus.REQUESTED,
            RideStatus.ACCEPTED,
            RideStatus.DRIVER_ARRIVING,
            RideStatus.IN_PROGRESS,
          ],
        },
      },
      include: this.rideInclude,
      orderBy: { createdAt: 'desc' },
    });

    return ride ? toTripJson(ride) : null;
  }

  estimateFare(dto: EstimateFareDto) {
    const result = this.calculateFare(
      dto.pickupLat,
      dto.pickupLng,
      dto.dropoffLat,
      dto.dropoffLng,
      dto.rideTierKey,
    );
    return buildResponse(MessageKeys.RIDE.FARE_ESTIMATED, result);
  }

  private calculateFare(
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number,
    tierKey?: string,
  ) {
    const distanceKm = this.haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
    const tierMultiplier = tierKey === 'premium' ? 1.4 : tierKey === 'comfort' ? 1.2 : 1;
    const fare = Math.round((BASE_FARE + distanceKm * PER_KM_RATE) * tierMultiplier);
    const etaMinutes = Math.max(5, Math.round(distanceKm * 3));

    return {
      fare,
      distanceKm: Math.round(distanceKm * 100) / 100,
      etaMinutes,
      currency: 'EGP',
    };
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private async getRideOrThrow(id: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id },
      include: this.rideInclude,
    });
    if (!ride) {
      throw new NotFoundException(buildErrorResponse(MessageKeys.RIDE.NOT_FOUND));
    }
    return ride;
  }

  private assertRideAccess(
    ride: { riderId: string; driverId: string | null },
    userId: string,
  ) {
    if (ride.riderId !== userId && ride.driverId !== userId) {
      throw new ForbiddenException(buildErrorResponse(MessageKeys.RIDE.FORBIDDEN));
    }
  }

  private validateTransition(current: RideStatus, next: RideStatus) {
    const allowed: Record<RideStatus, RideStatus[]> = {
      [RideStatus.REQUESTED]: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
      [RideStatus.ACCEPTED]: [
        RideStatus.DRIVER_ARRIVING,
        RideStatus.IN_PROGRESS,
        RideStatus.CANCELLED,
      ],
      [RideStatus.DRIVER_ARRIVING]: [RideStatus.IN_PROGRESS, RideStatus.CANCELLED],
      [RideStatus.IN_PROGRESS]: [RideStatus.COMPLETED, RideStatus.CANCELLED],
      [RideStatus.COMPLETED]: [],
      [RideStatus.CANCELLED]: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(buildErrorResponse(MessageKeys.RIDE.INVALID_STATUS));
    }
  }
}
