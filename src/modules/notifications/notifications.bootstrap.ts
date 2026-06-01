import { Injectable, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsBootstrapService implements OnModuleInit {
  constructor(private readonly notificationsService: NotificationsService) {}

  async onModuleInit() {
    await this.notificationsService.scheduleRetryFailedJob();
  }
}
