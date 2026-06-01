import './setup-env';
import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { JobsModule } from '../src/jobs/jobs.module';

export function createMockPrisma() {
  return {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    ride: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    delivery: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    deviceToken: { upsert: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    notification: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    passwordResetToken: { create: jest.fn(), findFirst: jest.fn() },
    driverProfile: { update: jest.fn(), findUnique: jest.fn() },
    syncRequest: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };
}

@Module({
  providers: [
    {
      provide: NotificationsService,
      useValue: {
        queueNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
        sendNotification: jest.fn(),
        retryFailed: jest.fn().mockResolvedValue({ retried: 0 }),
        scheduleRetryFailedJob: jest.fn(),
        enqueueSend: jest.fn(),
      },
    },
  ],
  exports: [NotificationsService],
})
class TestNotificationsModule {}

@Module({})
class TestJobsModule {}

export async function createTestApp(mockPrisma = createMockPrisma()) {
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
  };

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideModule(JobsModule)
    .useModule(TestJobsModule)
    .overrideModule(NotificationsModule)
    .useModule(TestNotificationsModule)
    .overrideProvider(PrismaService)
    .useValue(mockPrisma)
    .overrideProvider(REDIS_CLIENT)
    .useValue(mockRedis)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  return { app, mockPrisma, mockRedis };
}

export { request };
