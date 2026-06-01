import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LocationService } from '../location/location.service';
import { DeliveryStatus } from '@prisma/client';

describe('DeliveriesService', () => {
  let service: DeliveriesService;

  const mockPrisma = {
    delivery: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotifications = {
    queueNotification: jest.fn(),
  };

  const mockLocation = {
    saveDeliveryLocation: jest.fn(),
    getDeliveryLocation: jest.fn(),
    getDeliveryLocationHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveriesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: LocationService, useValue: mockLocation },
      ],
    }).compile();

    service = module.get(DeliveriesService);
    jest.clearAllMocks();
  });

  it('creates a delivery request', async () => {
    mockPrisma.delivery.findUnique.mockResolvedValue(null);
    mockPrisma.delivery.create.mockResolvedValue({
      id: 'del-1',
      customerId: 'user-1',
      courierId: null,
      pickupAddress: 'Shop',
      dropoffAddress: 'Home',
      pickupLat: 30.04,
      pickupLng: 31.23,
      dropoffLat: 30.06,
      dropoffLng: 31.25,
      status: DeliveryStatus.REQUESTED,
      fee: 35,
      packageNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create('user-1', {
      pickupAddress: 'Shop',
      dropoffAddress: 'Home',
      pickupLat: 30.04,
      pickupLng: 31.23,
      dropoffLat: 30.06,
      dropoffLng: 31.25,
    });

    expect(result.status).toBe('requested');
    expect(result.id).toBe('del-1');
  });

  it('throws when delivery not found', async () => {
    mockPrisma.delivery.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing', 'user-1')).rejects.toThrow(NotFoundException);
  });
});
