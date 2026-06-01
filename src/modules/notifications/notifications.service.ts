import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationStatus } from '@prisma/client';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseInitialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
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

    await this.sendNotification(notification.id);
    return notification;
  }

  async sendNotification(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) return;

    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: notification.userId },
    });

    if (!tokens.length || !this.firebaseInitialized) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: this.firebaseInitialized ? NotificationStatus.SENT : NotificationStatus.PENDING,
          sentAt: this.firebaseInitialized ? null : undefined,
        },
      });
      if (!this.firebaseInitialized) {
        this.logger.debug(`Firebase not configured; notification ${notificationId} queued only`);
      }
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
        data: { status: NotificationStatus.SENT, sentAt: new Date() },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.FAILED, errorMessage: message },
      });
      this.logger.error(`Failed to send notification ${notificationId}: ${message}`);
    }
  }

  async retryFailed(limit = 20) {
    const failed = await this.prisma.notification.findMany({
      where: { status: NotificationStatus.FAILED },
      take: limit,
    });

    for (const n of failed) {
      await this.sendNotification(n.id);
    }
  }
}
