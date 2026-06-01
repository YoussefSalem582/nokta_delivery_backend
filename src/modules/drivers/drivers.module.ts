import { Module, forwardRef } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { LocationModule } from '../location/location.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [LocationModule, forwardRef(() => NotificationsModule)],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
