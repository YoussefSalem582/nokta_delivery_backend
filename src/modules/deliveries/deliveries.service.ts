import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MessageKeys } from '../../common/messages/message-keys';
import { buildErrorResponse } from '../../common/responses/api-response';
import { toDeliveryStatus } from '../../common/mappers/status.mapper';
import { NotificationKeys } from '../../common/messages/notification-keys';
import {
  AssignCourierDto,
  CreateDeliveryDto,
  UpdateDeliveryStatusDto,
} from './dto/delivery.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { LocationService } from '../location/location.service';
import { UpdateLocationDto } from '../rides/dto/ride.dto';

const statusReverse: Record<string, DeliveryStatus> = {
  requested: DeliveryStatus.REQUESTED,
  assigned: DeliveryStatus.ASSIGNED,
  pickedUp: DeliveryStatus.PICKED_UP,
  inTransit: DeliveryStatus.IN_TRANSIT,
  delivered: DeliveryStatus.DELIVERED,
  cancelled: DeliveryStatus.CANCELLED,
};

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly locationService: LocationService,
  ) {}

  async create(userId: string, dto: CreateDeliveryDto) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.delivery.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return this.toJson(existing);
    }

    const delivery = await this.prisma.delivery.create({
      data: {
        customerId: userId,
        pickupAddress: dto.pickupAddress,
        dropoffAddress: dto.dropoffAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        fee: dto.fee ?? 35,
        packageNotes: dto.packageNotes,
        idempotencyKey: dto.idempotencyKey,
        events: { create: { status: DeliveryStatus.REQUESTED } },
      },
    });

    return this.toJson(delivery);
  }

  async findAllForUser(userId: string) {
    const deliveries = await this.prisma.delivery.findMany({
      where: { OR: [{ customerId: userId }, { courierId: userId }] },
      orderBy: { createdAt: 'desc' },
    });
    return deliveries.map((d) => this.toJson(d));
  }

  async findById(id: string, userId: string) {
    const delivery = await this.getOrThrow(id);
    if (delivery.customerId !== userId && delivery.courierId !== userId) {
      throw new ForbiddenException(buildErrorResponse(MessageKeys.DELIVERY.NOT_FOUND));
    }
    return this.toJson(delivery);
  }

  async assignCourier(id: string, dto: AssignCourierDto) {
    const delivery = await this.prisma.delivery.update({
      where: { id },
      data: {
        courierId: dto.courierId,
        status: DeliveryStatus.ASSIGNED,
        events: { create: { status: DeliveryStatus.ASSIGNED } },
      },
    });

    await this.notificationsService.queueNotification(
      dto.courierId,
      NotificationKeys.DELIVERY.ASSIGNED.title,
      NotificationKeys.DELIVERY.ASSIGNED.body,
      { deliveryId: id },
    );

    return this.toJson(delivery);
  }

  async updateStatus(id: string, userId: string, dto: UpdateDeliveryStatusDto) {
    const delivery = await this.getOrThrow(id);
    if (delivery.customerId !== userId && delivery.courierId !== userId) {
      throw new ForbiddenException(buildErrorResponse(MessageKeys.DELIVERY.NOT_FOUND));
    }

    const next = statusReverse[dto.status];
    if (!next) {
      throw new BadRequestException(buildErrorResponse(MessageKeys.COMMON.VALIDATION_ERROR));
    }

    const updated = await this.prisma.delivery.update({
      where: { id },
      data: {
        status: next,
        events: { create: { status: next } },
      },
    });

    if (next === DeliveryStatus.DELIVERED) {
      await this.notificationsService.queueNotification(
        delivery.customerId,
        NotificationKeys.DELIVERY.COMPLETED.title,
        NotificationKeys.DELIVERY.COMPLETED.body,
        { deliveryId: id },
      );
    }

    return this.toJson(updated);
  }

  async updateLocation(id: string, userId: string, dto: UpdateLocationDto) {
    const delivery = await this.getOrThrow(id);
    if (delivery.courierId !== userId) {
      throw new ForbiddenException(buildErrorResponse(MessageKeys.DELIVERY.NOT_FOUND));
    }

    const live = await this.locationService.saveDeliveryLocation(id, userId, dto);
    return { deliveryId: id, live };
  }

  async getTracking(id: string, userId: string) {
    const delivery = await this.getOrThrow(id);
    if (delivery.customerId !== userId && delivery.courierId !== userId) {
      throw new ForbiddenException(buildErrorResponse(MessageKeys.DELIVERY.NOT_FOUND));
    }

    const [live, history] = await Promise.all([
      this.locationService.getDeliveryLocation(id),
      this.locationService.getDeliveryLocationHistory(id),
    ]);

    return {
      delivery: this.toJson(delivery),
      live,
      history: history.map((point) => ({
        lat: Number(point.lat),
        lng: Number(point.lng),
        heading: point.heading != null ? Number(point.heading) : undefined,
        recordedAt: point.recordedAt.toISOString(),
      })),
    };
  }

  private async getOrThrow(id: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) {
      throw new NotFoundException(buildErrorResponse(MessageKeys.DELIVERY.NOT_FOUND));
    }
    return delivery;
  }

  private toJson(delivery: {
    id: string;
    customerId: string;
    courierId: string | null;
    pickupAddress: string;
    dropoffAddress: string;
    pickupLat: unknown;
    pickupLng: unknown;
    dropoffLat: unknown;
    dropoffLng: unknown;
    status: DeliveryStatus;
    fee: unknown;
    packageNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: delivery.id,
      customerId: delivery.customerId,
      courierId: delivery.courierId ?? undefined,
      pickupAddress: delivery.pickupAddress,
      dropoffAddress: delivery.dropoffAddress,
      pickupLat: Number(delivery.pickupLat),
      pickupLng: Number(delivery.pickupLng),
      dropoffLat: Number(delivery.dropoffLat),
      dropoffLng: Number(delivery.dropoffLng),
      status: toDeliveryStatus(delivery.status),
      fee: Number(delivery.fee),
      packageNotes: delivery.packageNotes ?? undefined,
      createdAt: delivery.createdAt.toISOString(),
      updatedAt: delivery.updatedAt.toISOString(),
    };
  }
}
