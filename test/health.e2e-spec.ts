import { INestApplication } from '@nestjs/common';
import { createTestApp, request } from './test-app.factory';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns ok', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('nokta-api');
  });

  it('GET /api/health/ready checks database', async () => {
    const response = await request(app.getHttpServer()).get('/api/health/ready').expect(200);

    expect(response.body.status).toBe('ready');
    expect(response.body.database).toBe('connected');
  });
});
