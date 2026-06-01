import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationService } from '../modules/location/location.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/realtime' })
export class LocationGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly locationService: LocationService) {}

  @SubscribeMessage('joinRide')
  handleJoinRide(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(`ride:${data.rideId}`);
    return { joined: data.rideId };
  }

  @SubscribeMessage('driverLocation')
  async handleDriverLocation(
    @MessageBody() data: { userId: string; lat: number; lng: number; heading?: number },
  ) {
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
}
