import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationStatus } from '@prisma/client';
import { NOTIFICATIONS_QUEUE, SEND_NOTIFICATION_JOB } from '../../jobs/queues.constants';

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

  const mockQueue = {
    add: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken(NOTIFICATIONS_QUEUE), useValue: mockQueue },
        {
          provide: ConfigService,
          useValue: { get: () => undefined },
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
    jest.clearAllMocks();
  });

  it('queues notification in database and enqueues BullMQ job', async () => {
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif-1',
      userId: 'user-1',
      titleKey: 'title',
      bodyKey: 'body',
    });

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
    expect(mockQueue.add).toHaveBeenCalledWith(
      SEND_NOTIFICATION_JOB,
      { notificationId: 'notif-1' },
      expect.objectContaining({ attempts: 5 }),
    );
  });

  it('re-enqueues failed notifications for retry', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([
      { id: 'notif-failed', userId: 'user-1' },
    ]);
    mockPrisma.notification.update.mockResolvedValue({});

    const result = await service.retryFailed();

    expect(result.retried).toBe(1);
    expect(mockQueue.add).toHaveBeenCalledWith(
      SEND_NOTIFICATION_JOB,
      { notificationId: 'notif-failed' },
      expect.any(Object),
    );
  });
});
