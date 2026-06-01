import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { PrismaService } from '../../database/prisma.service';
import { REDIS_CLIENT } from '../../database/redis.constants';

describe('LocationService', () => {
  let service: LocationService;

  const mockRedis = {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
  };

  const mockPrisma = {
    rideLocation: { create: jest.fn() },
    ride: { update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    service = module.get(LocationService);
    jest.clearAllMocks();
  });

  it('saves driver location to redis', async () => {
    const result = await service.saveDriverLocation('driver-1', { lat: 30.04, lng: 31.23 });

    expect(result.lat).toBe(30.04);
    expect(mockRedis.set).toHaveBeenCalledWith(
      'driver:location:driver-1',
      expect.any(String),
      'EX',
      3600,
    );
  });

  it('persists ride location and updates redis', async () => {
    mockPrisma.rideLocation.create.mockResolvedValue({});
    mockPrisma.ride.update.mockResolvedValue({});

    await service.saveRideLocation('ride-1', 'driver-1', { lat: 30.05, lng: 31.24 });

    expect(mockPrisma.rideLocation.create).toHaveBeenCalled();
    expect(mockRedis.set).toHaveBeenCalledWith(
      'ride:location:ride-1',
      expect.any(String),
      'EX',
      7200,
    );
  });
});
