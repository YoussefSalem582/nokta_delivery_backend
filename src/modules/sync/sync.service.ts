import { Injectable } from '@nestjs/common';
import { SyncRequestStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MessageKeys } from '../../common/messages/message-keys';
import { buildResponse } from '../../common/responses/api-response';
import { RidesService } from '../rides/rides.service';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { SyncActionDto } from './dto/sync.dto';
import { RequestRideDto } from '../rides/dto/ride.dto';
import { CreateDeliveryDto } from '../deliveries/dto/delivery.dto';

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ridesService: RidesService,
    private readonly deliveriesService: DeliveriesService,
  ) {}

  async processBatch(userId: string, actions: SyncActionDto[]) {
    const results = [];

    for (const action of actions) {
      results.push(await this.processAction(userId, action));
    }

    return buildResponse(MessageKeys.SYNC.PROCESSED, { results });
  }

  async reconcile(userId: string) {
    const activeRide = await this.ridesService.getActiveRide(userId);
    const pendingSync = await this.prisma.syncRequest.findMany({
      where: { userId, status: SyncRequestStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });

    return {
      activeRide,
      pendingSyncCount: pendingSync.length,
      pendingActions: pendingSync.map((s) => ({
        clientActionId: s.clientActionId,
        actionType: s.actionType,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }

  private async processAction(userId: string, action: SyncActionDto) {
    const existing = await this.prisma.syncRequest.findUnique({
      where: {
        userId_clientActionId: { userId, clientActionId: action.clientActionId },
      },
    });

    if (existing?.status === SyncRequestStatus.PROCESSED) {
      return {
        clientActionId: action.clientActionId,
        status: 'duplicate',
        response: existing.response,
      };
    }

    const record = await this.prisma.syncRequest.upsert({
      where: {
        userId_clientActionId: { userId, clientActionId: action.clientActionId },
      },
      create: {
        userId,
        clientActionId: action.clientActionId,
        actionType: action.actionType,
        payload: action.payload as object,
      },
      update: {},
    });

    try {
      const response = await this.dispatch(userId, action);
      await this.prisma.syncRequest.update({
        where: { id: record.id },
        data: {
          status: SyncRequestStatus.PROCESSED,
          response: response as object,
          processedAt: new Date(),
        },
      });

      return { clientActionId: action.clientActionId, status: 'processed', response };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      await this.prisma.syncRequest.update({
        where: { id: record.id },
        data: { status: SyncRequestStatus.FAILED, response: { error: message } },
      });
      return { clientActionId: action.clientActionId, status: 'failed', error: message };
    }
  }

  private async dispatch(userId: string, action: SyncActionDto) {
    switch (action.actionType) {
      case 'ride.request':
        return this.ridesService.requestRide(userId, action.payload as unknown as RequestRideDto);
      case 'delivery.create':
        return this.deliveriesService.create(
          userId,
          action.payload as unknown as CreateDeliveryDto,
        );
      default:
        throw new Error(`Unsupported action type: ${action.actionType}`);
    }
  }
}
