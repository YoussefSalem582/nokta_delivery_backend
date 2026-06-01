import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsBootstrapService } from './notifications.bootstrap';
import { NotificationProcessor } from '../../jobs/notification.processor';
import { NOTIFICATIONS_QUEUE } from '../../jobs/queues.constants';

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  providers: [NotificationsService, NotificationsBootstrapService, NotificationProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
