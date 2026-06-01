import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationStatus } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../database/prisma.service';
import {
  NOTIFICATIONS_QUEUE,
  RETRY_FAILED_NOTIFICATIONS_JOB,
  SEND_NOTIFICATION_JOB,
} from '../../jobs/queues.constants';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseInitialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Optional() @InjectQueue(NOTIFICATIONS_QUEUE) private readonly notificationQueue?: Queue,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    const projectId = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey = this.configService.get<string>('firebase.privateKey');

    if (projectId && clientEmail && privateKey) {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
      this.firebaseInitialized = true;
    }
  }

  async queueNotification(
    userId: string,
    titleKey: string,
    bodyKey: string,
    data?: Record<string, string>,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        titleKey,
        bodyKey,
        data: data ?? {},
        status: NotificationStatus.PENDING,
      },
    });

    await this.enqueueSend(notification.id);
    return notification;
  }

  async enqueueSend(notificationId: string) {
    if (this.notificationQueue) {
      await this.notificationQueue.add(
        SEND_NOTIFICATION_JOB,
        { notificationId },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      );
      return;
    }

    await this.sendNotification(notificationId);
  }

  async sendNotification(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) return;

    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: notification.userId },
    });

    if (!tokens.length) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.PENDING },
      });
      this.logger.debug(`No device tokens for user ${notification.userId}`);
      return;
    }

    if (!this.firebaseInitialized) {
      this.logger.debug(`Firebase not configured; notification ${notificationId} stays pending`);
      return;
    }

    try {
      await admin.messaging().sendEachForMulticast({
        tokens: tokens.map((t) => t.token),
        notification: {
          title: notification.titleKey,
          body: notification.bodyKey,
        },
        data: Object.fromEntries(
          Object.entries((notification.data as Record<string, string>) ?? {}).map(([k, v]) => [
            k,
            String(v),
          ]),
        ),
      });

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.SENT, sentAt: new Date(), errorMessage: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.FAILED, errorMessage: message },
      });
      this.logger.error(`Failed to send notification ${notificationId}: ${message}`);
      throw error;
    }
  }

  async retryFailed(limit = 20) {
    const failed = await this.prisma.notification.findMany({
      where: { status: NotificationStatus.FAILED },
      take: limit,
    });

    for (const notification of failed) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.PENDING, errorMessage: null },
      });
      await this.enqueueSend(notification.id);
    }

    return { retried: failed.length };
  }

  async scheduleRetryFailedJob() {
    if (!this.notificationQueue) return;

    await this.notificationQueue.add(
      RETRY_FAILED_NOTIFICATIONS_JOB,
      {},
      {
        repeat: { every: 5 * 60 * 1000 },
        jobId: 'retry-failed-notifications',
      },
    );
  }
}
