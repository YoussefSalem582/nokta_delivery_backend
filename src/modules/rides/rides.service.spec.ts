import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RidesService } from './rides.service';
import { PrismaService } from '../../database/prisma.service';
import { RideStatus } from '@prisma/client';

describe('RidesService', () => {
  let service: RidesService;

  const mockPrisma = {
    ride: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RidesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get(RidesService);
    jest.clearAllMocks();
  });

  it('creates a ride request', async () => {
    mockPrisma.ride.findUnique.mockResolvedValue(null);
    mockPrisma.ride.create.mockResolvedValue({
      id: 'ride-1',
      riderId: 'user-1',
      driverId: null,
      pickupAddress: 'A',
      dropoffAddress: 'B',
      pickupLat: 30.04,
      pickupLng: 31.23,
      dropoffLat: 30.06,
      dropoffLng: 31.25,
      status: RideStatus.REQUESTED,
      fare: 50,
      distanceKm: 5,
      etaMinutes: 15,
      paymentMethodKey: null,
      rideTierKey: null,
      driverLat: null,
      driverLng: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rider: { id: 'user-1', name: 'Rider', phone: '+201', avatarUrl: null },
      driver: null,
    });

    const result = await service.requestRide('user-1', {
      pickupAddress: 'A',
      dropoffAddress: 'B',
      pickupLat: 30.04,
      pickupLng: 31.23,
      dropoffLat: 30.06,
      dropoffLng: 31.25,
    });

    expect(result.status).toBe('requested');
    expect(result.id).toBe('ride-1');
  });

  it('estimates fare for cairo coordinates', () => {
    const result = service.estimateFare({
      pickupLat: 30.0444,
      pickupLng: 31.2357,
      dropoffLat: 30.0626,
      dropoffLng: 31.2497,
    });

    expect(result.success).toBe(true);
    expect(result.data?.currency).toBe('EGP');
    expect(result.data?.fare).toBeGreaterThan(0);
  });

  it('throws when ride not found', async () => {
    mockPrisma.ride.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing', 'user-1')).rejects.toThrow(NotFoundException);
  });
});
