import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsAuthService } from './ws-auth.service';
import { PrismaService } from '../database/prisma.service';

describe('WsAuthService', () => {
  let service: WsAuthService;
  const jwtService = { verify: jest.fn() };
  const prisma = {
    user: { findUnique: jest.fn() },
    ride: { findUnique: jest.fn() },
    delivery: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        WsAuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-access-secret-minimum-32-chars') },
        },
      ],
    }).compile();

    service = moduleRef.get(WsAuthService);
  });

  it('returns null when token is missing', async () => {
    await expect(service.authenticateToken(undefined)).resolves.toBeNull();
  });

  it('returns user payload when token and user are valid', async () => {
    jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'a@b.com', role: 'RIDER' });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      role: 'RIDER',
      isActive: true,
    });

    const result = await service.authenticateToken('valid-token');
    expect(result).toEqual({ sub: 'user-1', email: 'a@b.com', role: 'RIDER' });
  });

  it('canJoinRide allows rider or driver on the ride', async () => {
    prisma.ride.findUnique.mockResolvedValue({ riderId: 'r1', driverId: 'd1' });
    await expect(service.canJoinRide('r1', 'ride-1')).resolves.toBe(true);
    await expect(service.canJoinRide('d1', 'ride-1')).resolves.toBe(true);
    await expect(service.canJoinRide('other', 'ride-1')).resolves.toBe(false);
  });

  it('canPublishRideLocation allows only assigned driver', async () => {
    prisma.ride.findUnique.mockResolvedValue({ driverId: 'd1' });
    await expect(service.canPublishRideLocation('d1', 'ride-1')).resolves.toBe(true);
    await expect(service.canPublishRideLocation('r1', 'ride-1')).resolves.toBe(false);
  });

  it('canJoinDelivery allows customer or courier', async () => {
    prisma.delivery.findUnique.mockResolvedValue({ customerId: 'c1', courierId: 'u1' });
    await expect(service.canJoinDelivery('c1', 'del-1')).resolves.toBe(true);
    await expect(service.canJoinDelivery('u1', 'del-1')).resolves.toBe(true);
    await expect(service.canJoinDelivery('other', 'del-1')).resolves.toBe(false);
  });
});
