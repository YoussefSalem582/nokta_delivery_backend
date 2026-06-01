import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService } from '../modules/notifications/notifications.service';
import {
  NOTIFICATIONS_QUEUE,
  RETRY_FAILED_NOTIFICATIONS_JOB,
  SEND_NOTIFICATION_JOB,
} from './queues.constants';

export interface SendNotificationJobData {
  notificationId: string;
}

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<SendNotificationJobData>): Promise<void> {
    if (job.name === SEND_NOTIFICATION_JOB) {
      await this.notificationsService.sendNotification(job.data.notificationId);
      return;
    }

    if (job.name === RETRY_FAILED_NOTIFICATIONS_JOB) {
      await this.notificationsService.retryFailed();
      return;
    }

    this.logger.warn(`Unknown job name: ${job.name}`);
  }
}
