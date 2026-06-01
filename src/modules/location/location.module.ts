import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationGateway } from '../../realtime/location.gateway';

@Module({
  providers: [LocationService, LocationGateway],
  exports: [LocationService, LocationGateway],
})
export class LocationModule {}
