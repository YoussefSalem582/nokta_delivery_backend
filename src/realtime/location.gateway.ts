import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ForbiddenException, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { UserRole } from '@prisma/client';
import { LocationService } from '../modules/location/location.service';
import { UpdateLocationDto } from '../modules/rides/dto/ride.dto';
import { WsAuthService, WsUserPayload } from './ws-auth.service';

interface AuthenticatedSocket extends Socket {
  data: { user?: WsUserPayload };
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/realtime' })
export class LocationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LocationGateway.name);

  constructor(
    private readonly locationService: LocationService,
    private readonly wsAuth: WsAuthService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const token = client.handshake.auth?.token as string | undefined;
    const user = await this.wsAuth.authenticateToken(token);

    if (!user) {
      this.logger.warn('WebSocket connection rejected: missing or invalid JWT');
      client.disconnect(true);
      return;
    }

    client.data.user = user;
  }

  @SubscribeMessage('joinRide')
  async handleJoinRide(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;
    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }

    const allowed = await this.wsAuth.canJoinRide(user.sub, data.rideId);
    if (!allowed) {
      throw new ForbiddenException('Not allowed to join this ride room');
    }

    void client.join(`ride:${data.rideId}`);
    return { joined: data.rideId };
  }

  @SubscribeMessage('joinDelivery')
  async handleJoinDelivery(
    @MessageBody() data: { deliveryId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;
    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }

    const allowed = await this.wsAuth.canJoinDelivery(user.sub, data.deliveryId);
    if (!allowed) {
      throw new ForbiddenException('Not allowed to join this delivery room');
    }

    void client.join(`delivery:${data.deliveryId}`);
    return { joined: data.deliveryId };
  }

  @SubscribeMessage('publishRideLocation')
  async handlePublishRideLocation(
    @MessageBody() data: { rideId: string; lat: number; lng: number; heading?: number; speed?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;
    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }

    const allowed = await this.wsAuth.canPublishRideLocation(user.sub, data.rideId);
    if (!allowed) {
      throw new ForbiddenException('Only the assigned driver may publish ride location');
    }

    const dto: UpdateLocationDto = {
      lat: data.lat,
      lng: data.lng,
      heading: data.heading,
      speed: data.speed,
    };

    const payload = await this.locationService.saveRideLocation(data.rideId, user.sub, dto);
    this.broadcastRideLocation(data.rideId, JSON.parse(payload));

    return { ok: true };
  }

  @SubscribeMessage('publishDeliveryLocation')
  async handlePublishDeliveryLocation(
    @MessageBody() data: { deliveryId: string; lat: number; lng: number; heading?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;
    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }

    const allowed = await this.wsAuth.canPublishDeliveryLocation(user.sub, data.deliveryId);
    if (!allowed) {
      throw new ForbiddenException('Only the assigned courier may publish delivery location');
    }

    const live = await this.locationService.saveDeliveryLocation(data.deliveryId, user.sub, {
      lat: data.lat,
      lng: data.lng,
      heading: data.heading,
    });

    this.broadcastDeliveryLocation(data.deliveryId, live);

    return { ok: true };
  }

  @SubscribeMessage('driverLocation')
  async handleDriverLocation(
    @MessageBody() data: { userId: string; lat: number; lng: number; heading?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;
    if (!user || user.role !== UserRole.DRIVER || user.sub !== data.userId) {
      throw new ForbiddenException('Only the authenticated driver may publish location');
    }

    await this.locationService.saveDriverLocation(data.userId, {
      lat: data.lat,
      lng: data.lng,
      heading: data.heading,
    });

    this.server.emit(`driver:${data.userId}`, {
      lat: data.lat,
      lng: data.lng,
      heading: data.heading,
      updatedAt: new Date().toISOString(),
    });
  }

  broadcastRideLocation(rideId: string, payload: unknown) {
    this.server.to(`ride:${rideId}`).emit('rideLocation', payload);
  }

  broadcastDeliveryLocation(deliveryId: string, payload: unknown) {
    this.server.to(`delivery:${deliveryId}`).emit('deliveryLocation', payload);
  }
}
