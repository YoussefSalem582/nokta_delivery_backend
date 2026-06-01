import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationStatus } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    deviceToken: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: { get: () => undefined },
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
    jest.clearAllMocks();
  });

  it('queues notification in database', async () => {
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif-1',
      userId: 'user-1',
      titleKey: 'title',
      bodyKey: 'body',
    });
    mockPrisma.notification.findUnique.mockResolvedValue({
      id: 'notif-1',
      userId: 'user-1',
      titleKey: 'title',
      bodyKey: 'body',
      data: {},
    });
    mockPrisma.notification.update.mockResolvedValue({});

    const result = await service.queueNotification('user-1', 'title', 'body', { rideId: 'r1' });

    expect(result.id).toBe('notif-1');
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          status: NotificationStatus.PENDING,
        }),
      }),
    );
  });
});
