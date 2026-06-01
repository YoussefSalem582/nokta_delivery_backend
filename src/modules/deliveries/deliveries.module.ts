import { Module, forwardRef } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { OrdersController } from './orders.controller';
import { DeliveriesService } from './deliveries.service';
import { NotificationsModule } from '../notifications/notifications.module';

import { LocationModule } from '../location/location.module';

@Module({
  imports: [forwardRef(() => NotificationsModule), LocationModule],
  controllers: [DeliveriesController, OrdersController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
