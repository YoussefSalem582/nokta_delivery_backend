import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriverAvailability, RideStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MessageKeys } from '../../common/messages/message-keys';
import { buildErrorResponse } from '../../common/responses/api-response';
import {
  fromAvailability,
  fromTripStatus,
  toAvailability,
  toTripJson,
} from '../../common/mappers/status.mapper';
import { UpdateLocationDto, UpdateRideStatusDto } from '../rides/dto/ride.dto';
import { LocationService } from '../location/location.service';
import { LocationGateway } from '../../realtime/location.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import {
  getRideStatusNotification,
} from '../../common/messages/notification-keys';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DriverRegisterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vehicleMakeModel!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  licensePlate!: string;

  @ApiPropertyOptional()
  @IsBoolean()
  termsAccepted?: boolean;
}

export class UpdateAvailabilityDto {
  @ApiProperty({ example: 'online' })
  @IsString()
  @IsNotEmpty()
  status!: string;
}

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationService: LocationService,
    private readonly locationGateway: LocationGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

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

  async registerDriver(userId: string, dto: DriverRegisterDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: dto.phone,
        role: UserRole.DRIVER,
        driverProfile: {
          upsert: {
            create: {
              isRegistered: true,
              registeredAt: new Date(),
              termsAcceptedAt: dto.termsAccepted ? new Date() : null,
              vehicle: {
                create: {
                  vehicleType: dto.vehicleType,
                  makeModel: dto.vehicleMakeModel,
                  licensePlate: dto.licensePlate,
                },
              },
            },
            update: {
              isRegistered: true,
              registeredAt: new Date(),
              termsAcceptedAt: dto.termsAccepted ? new Date() : null,
              vehicle: {
                upsert: {
                  create: {
                    vehicleType: dto.vehicleType,
                    makeModel: dto.vehicleMakeModel,
                    licensePlate: dto.licensePlate,
                  },
                  update: {
                    vehicleType: dto.vehicleType,
                    makeModel: dto.vehicleMakeModel,
                    licensePlate: dto.licensePlate,
                  },
                },
              },
            },
          },
        },
      },
      include: {
        driverProfile: { include: { vehicle: true } },
      },
    });

    return this.toProfileResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { driverProfile: { include: { vehicle: true } } },
    });
    return this.toProfileResponse(user);
  }

  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const availability = fromAvailability(dto.status);
    await this.prisma.driverProfile.update({
      where: { userId },
      data: { availability },
    });
    return { status: toAvailability(availability) };
  }

  async getOffers(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile?.isRegistered) return [];

    const rides = await this.prisma.ride.findMany({
      where: {
        status: RideStatus.REQUESTED,
        driverId: null,
        NOT: { riderId: userId },
      },
      include: this.rideInclude,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return rides.map(toTripJson);
  }

  async acceptOffer(userId: string, tripId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: tripId },
      include: this.rideInclude,
    });

    if (!ride) {
      throw new NotFoundException(buildErrorResponse(MessageKeys.RIDE.NOT_FOUND));
    }
    if (ride.riderId === userId) {
      throw new BadRequestException(buildErrorResponse(MessageKeys.RIDE.FORBIDDEN));
    }
    if (ride.status !== RideStatus.REQUESTED) {
      throw new BadRequestException(buildErrorResponse(MessageKeys.RIDE.INVALID_STATUS));
    }

    const updated = await this.prisma.ride.update({
      where: { id: tripId },
      data: {
        driverId: userId,
        status: RideStatus.ACCEPTED,
        events: { create: { status: RideStatus.ACCEPTED } },
      },
      include: this.rideInclude,
    });

    await this.prisma.driverProfile.update({
      where: { userId },
      data: { availability: DriverAvailability.ON_TRIP },
    });

    await this.notifyRideStatus(updated.riderId, tripId, RideStatus.ACCEPTED);

    return toTripJson(updated);
  }

  async declineOffer(_userId: string, tripId: string) {
    return { id: tripId, declined: true };
  }

  async updateTripStatus(userId: string, tripId: string, dto: UpdateRideStatusDto) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: tripId },
      include: this.rideInclude,
    });

    if (!ride || ride.driverId !== userId) {
      throw new ForbiddenException(buildErrorResponse(MessageKeys.RIDE.FORBIDDEN));
    }

    const nextStatus = fromTripStatus(dto.status);
    const updated = await this.prisma.ride.update({
      where: { id: tripId },
      data: {
        status: nextStatus,
        events: { create: { status: nextStatus } },
      },
      include: this.rideInclude,
    });

    if (nextStatus === RideStatus.COMPLETED || nextStatus === RideStatus.CANCELLED) {
      await this.prisma.driverProfile.update({
        where: { userId },
        data: { availability: DriverAvailability.ONLINE },
      });
    }

    await this.notifyRideStatus(ride.riderId, tripId, nextStatus);

    return toTripJson(updated);
  }

  async updateTripLocation(userId: string, tripId: string, dto: UpdateLocationDto) {
    const ride = await this.prisma.ride.findUnique({ where: { id: tripId } });
    if (!ride || ride.driverId !== userId) {
      throw new ForbiddenException(buildErrorResponse(MessageKeys.RIDE.FORBIDDEN));
    }

    const payload = await this.locationService.saveRideLocation(tripId, userId, dto);
    this.locationGateway.broadcastRideLocation(tripId, JSON.parse(payload));

    const updated = await this.prisma.ride.findUnique({
      where: { id: tripId },
      include: this.rideInclude,
    });

    return toTripJson(updated!);
  }

  async listDrivers() {
    const drivers = await this.prisma.user.findMany({
      where: { role: UserRole.DRIVER, driverProfile: { isRegistered: true } },
      include: {
        driverProfile: { include: { vehicle: true } },
      },
      take: 50,
    });

    const results = await Promise.all(
      drivers.map(async (d) => {
        const loc = await this.locationService.getDriverLocation(d.id);
        return {
          id: d.id,
          name: d.name,
          phone: d.phone,
          rating: d.driverProfile ? Number(d.driverProfile.rating) : 5,
          vehicle: d.driverProfile?.vehicle
            ? `${d.driverProfile.vehicle.makeModel} (${d.driverProfile.vehicle.vehicleType})`
            : '',
          lat: loc ? (loc.lat as number) : 30.0444,
          lng: loc ? (loc.lng as number) : 31.2357,
        };
      }),
    );

    return results;
  }

  private async notifyRideStatus(riderId: string, rideId: string, status: RideStatus) {
    const config = getRideStatusNotification(status);
    if (!config) return;

    await this.notificationsService.queueNotification(riderId, config.title, config.body, {
      rideId,
      status,
    });
  }

  private toProfileResponse(
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      walletBalance: unknown;
      avatarUrl: string | null;
      driverProfile?: {
        isRegistered: boolean;
        registeredAt: Date | null;
        vehicle?: {
          vehicleType: string;
          makeModel: string;
          licensePlate: string;
        } | null;
      } | null;
    },
  ) {
    const dp = user.driverProfile;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      walletBalance: Number(user.walletBalance),
      avatarUrl: user.avatarUrl,
      isDriverRegistered: dp?.isRegistered ?? false,
      driverProfile: dp?.isRegistered
        ? {
            phone: user.phone,
            vehicleType: dp.vehicle?.vehicleType,
            vehicleMakeModel: dp.vehicle?.makeModel,
            licensePlate: dp.vehicle?.licensePlate,
            registeredAt: dp.registeredAt?.toISOString(),
            termsAccepted: true,
          }
        : undefined,
    };
  }
}
