import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WsAuthService } from './ws-auth.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [WsAuthService],
  exports: [WsAuthService],
})
export class RealtimeModule {}
