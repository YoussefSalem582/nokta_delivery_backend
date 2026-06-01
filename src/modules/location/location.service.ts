import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../database/prisma.service';
import { REDIS_CLIENT } from '../../database/redis.constants';
import { UpdateLocationDto } from '../rides/dto/ride.dto';

const DRIVER_LOCATION_PREFIX = 'driver:location:';
const RIDE_LOCATION_PREFIX = 'ride:location:';
const DELIVERY_LOCATION_PREFIX = 'delivery:location:';

@Injectable()
export class LocationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async saveDriverLocation(userId: string, dto: UpdateLocationDto) {
    const payload = JSON.stringify({
      lat: dto.lat,
      lng: dto.lng,
      heading: dto.heading,
      speed: dto.speed,
      updatedAt: new Date().toISOString(),
    });

    await this.redis.set(`${DRIVER_LOCATION_PREFIX}${userId}`, payload, 'EX', 3600);
    return { lat: dto.lat, lng: dto.lng };
  }

  async getDriverLocation(userId: string) {
    const raw = await this.redis.get(`${DRIVER_LOCATION_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  }

  async saveRideLocation(rideId: string, userId: string, dto: UpdateLocationDto) {
    await this.prisma.rideLocation.create({
      data: {
        rideId,
        lat: dto.lat,
        lng: dto.lng,
        heading: dto.heading,
        speed: dto.speed,
      },
    });

    const payload = JSON.stringify({
      rideId,
      driverId: userId,
      lat: dto.lat,
      lng: dto.lng,
      heading: dto.heading,
      updatedAt: new Date().toISOString(),
    });

    await this.redis.set(`${RIDE_LOCATION_PREFIX}${rideId}`, payload, 'EX', 7200);

    await this.prisma.ride.update({
      where: { id: rideId },
      data: { driverLat: dto.lat, driverLng: dto.lng },
    });

    return payload;
  }

  async getRideLocation(rideId: string): Promise<Record<string, unknown> | null> {
    const raw = await this.redis.get(`${RIDE_LOCATION_PREFIX}${rideId}`);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  }

  async saveDeliveryLocation(deliveryId: string, courierId: string, dto: UpdateLocationDto) {
    await this.prisma.deliveryLocation.create({
      data: {
        deliveryId,
        lat: dto.lat,
        lng: dto.lng,
        heading: dto.heading,
      },
    });

    const payload = {
      deliveryId,
      courierId,
      lat: dto.lat,
      lng: dto.lng,
      heading: dto.heading,
      updatedAt: new Date().toISOString(),
    };

    await this.redis.set(
      `${DELIVERY_LOCATION_PREFIX}${deliveryId}`,
      JSON.stringify(payload),
      'EX',
      7200,
    );

    return payload;
  }

  async getDeliveryLocation(deliveryId: string): Promise<Record<string, unknown> | null> {
    const raw = await this.redis.get(`${DELIVERY_LOCATION_PREFIX}${deliveryId}`);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  }

  async getDeliveryLocationHistory(deliveryId: string, limit = 50) {
    return this.prisma.deliveryLocation.findMany({
      where: { deliveryId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }
}
