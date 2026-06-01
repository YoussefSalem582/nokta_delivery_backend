import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationGateway } from '../../realtime/location.gateway';
import { RealtimeModule } from '../../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  providers: [LocationService, LocationGateway],
  exports: [LocationService, LocationGateway],
})
export class LocationModule {}
