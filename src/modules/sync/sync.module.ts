import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { RidesModule } from '../rides/rides.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';

@Module({
  imports: [RidesModule, DeliveriesModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
