/**
 * Exports the NestJS Swagger document to docs/openapi/nokta-api.openapi.json
 * Run: npm run docs:openapi
 */
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { JobsModule } from '../src/jobs/jobs.module';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://nokta:nokta_secret@localhost:5432/nokta_db?schema=public';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'export-access-secret-minimum-32-chars';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'export-refresh-secret-minimum-32-chars';

@Module({
  providers: [
    {
      provide: NotificationsService,
      useValue: {
        queueNotification: async () => ({}),
        sendNotification: async () => undefined,
        retryFailed: async () => ({ retried: 0 }),
        scheduleRetryFailedJob: async () => undefined,
        enqueueSend: async () => undefined,
      },
    },
  ],
  exports: [NotificationsService],
})
class ExportNotificationsModule {}

@Module({})
class ExportJobsModule {}

async function exportOpenApi() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideModule(JobsModule)
    .useModule(ExportJobsModule)
    .overrideModule(NotificationsModule)
    .useModule(ExportNotificationsModule)
    .overrideProvider(PrismaService)
    .useValue({
      $connect: async () => undefined,
      $disconnect: async () => undefined,
    })
    .overrideProvider(REDIS_CLIENT)
    .useValue({ get: async () => null, set: async () => 'OK' })
    .compile();

  const app: INestApplication = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nokta API')
    .setDescription(
      'Ride-hailing and delivery platform API for Egypt. Supports riders, drivers, couriers, and admins.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addServer('http://localhost:3000', 'Local development')
    .addServer('https://api.nokta.app', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  const outputDir = join(__dirname, '..', 'docs', 'openapi');
  mkdirSync(outputDir, { recursive: true });

  const outputPath = join(outputDir, 'nokta-api.openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`OpenAPI spec written to ${outputPath}`);
  await app.close();
}

exportOpenApi().catch((error) => {
  console.error(error);
  process.exit(1);
});
