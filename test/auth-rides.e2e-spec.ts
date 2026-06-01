import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { createMockPrisma, createTestApp, request } from './test-app.factory';

describe('Auth & Rides (e2e)', () => {
  let app: INestApplication;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    ({ app, mockPrisma } = await createTestApp(mockPrisma));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$connect.mockResolvedValue(undefined);
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('POST /api/v1/auth/register creates a user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'rider@nokta.app',
      name: 'Rider',
      phone: '+201012345678',
      walletBalance: 0,
      avatarUrl: null,
      role: UserRole.RIDER,
      driverProfile: null,
    });
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Rider',
        email: 'rider@nokta.app',
        phone: '+201012345678',
        password: 'SecurePass123!',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user.email).toBe('rider@nokta.app');
  });

  it('POST /api/trips/request requires authentication', async () => {
    await request(app.getHttpServer())
      .post('/api/trips/request')
      .send({
        pickupAddress: 'A',
        dropoffAddress: 'B',
        pickupLat: 30.04,
        pickupLng: 31.23,
        dropoffLat: 30.06,
        dropoffLng: 31.25,
      })
      .expect(401);
  });

  it('POST /api/trips/request creates a trip for authenticated rider', async () => {
    const passwordHash = await bcrypt.hash('SecurePass123!', 12);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'rider@nokta.app',
      passwordHash,
      role: UserRole.RIDER,
      isActive: true,
    });
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'rider@nokta.app', password: 'SecurePass123!' })
      .expect(201);

    const token = login.body.data.accessToken as string;

    mockPrisma.ride.findUnique.mockResolvedValue(null);
    mockPrisma.ride.create.mockResolvedValue({
      id: 'ride-1',
      riderId: 'user-1',
      driverId: null,
      pickupAddress: 'Tahrir',
      dropoffAddress: 'Maadi',
      pickupLat: 30.0444,
      pickupLng: 31.2357,
      dropoffLat: 30.0626,
      dropoffLng: 31.2497,
      status: 'REQUESTED',
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

    const trip = await request(app.getHttpServer())
      .post('/api/trips/request')
      .set('Authorization', `Bearer ${token}`)
      .send({
        pickupAddress: 'Tahrir',
        dropoffAddress: 'Maadi',
        pickupLat: 30.0444,
        pickupLng: 31.2357,
        dropoffLat: 30.0626,
        dropoffLng: 31.2497,
      })
      .expect(201);

    expect(trip.body.status).toBe('requested');
    expect(trip.body.id).toBe('ride-1');
  });
});
