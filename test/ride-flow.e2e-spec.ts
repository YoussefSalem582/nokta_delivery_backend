import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DriverAvailability, RideStatus, UserRole } from '@prisma/client';
import { createMockPrisma, createTestApp, request } from './test-app.factory';

describe('Ride flow (e2e)', () => {
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
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('login → request trip → driver accept → active trip', async () => {
    const passwordHash = await bcrypt.hash('SecurePass123!', 12);

    mockPrisma.user.findUnique.mockImplementation(async (args: { where: { email?: string; id?: string } }) => {
      if (args.where.email === 'rider@nokta.app') {
        return {
          id: 'rider-1',
          email: 'rider@nokta.app',
          passwordHash,
          role: UserRole.RIDER,
          isActive: true,
        };
      }
      if (args.where.email === 'driver@nokta.app') {
        return {
          id: 'driver-1',
          email: 'driver@nokta.app',
          passwordHash,
          role: UserRole.DRIVER,
          isActive: true,
          driverProfile: { id: 'dp-1', isRegistered: true, availability: DriverAvailability.ONLINE },
        };
      }
      if (args.where.id === 'driver-1') {
        return {
          id: 'driver-1',
          email: 'driver@nokta.app',
          role: UserRole.DRIVER,
          isActive: true,
          driverProfile: { id: 'dp-1', isRegistered: true, availability: DriverAvailability.ONLINE },
        };
      }
      if (args.where.id === 'rider-1') {
        return {
          id: 'rider-1',
          email: 'rider@nokta.app',
          role: UserRole.RIDER,
          isActive: true,
        };
      }
      return null;
    });

    mockPrisma.refreshToken.create.mockResolvedValue({});

    const riderLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'rider@nokta.app', password: 'SecurePass123!' })
      .expect(201);

    const riderToken = riderLogin.body.data.accessToken as string;

    mockPrisma.ride.create.mockResolvedValue({
      id: 'ride-1',
      riderId: 'rider-1',
      driverId: null,
      pickupAddress: 'Tahrir',
      dropoffAddress: 'Maadi',
      pickupLat: 30.0444,
      pickupLng: 31.2357,
      dropoffLat: 30.0626,
      dropoffLng: 31.2497,
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
      rider: { id: 'rider-1', name: 'Rider', phone: '+201', avatarUrl: null },
      driver: null,
    });

    await request(app.getHttpServer())
      .post('/api/trips/request')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({
        pickupAddress: 'Tahrir',
        dropoffAddress: 'Maadi',
        pickupLat: 30.0444,
        pickupLng: 31.2357,
        dropoffLat: 30.0626,
        dropoffLng: 31.2497,
      })
      .expect(201);

    const driverLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'driver@nokta.app', password: 'SecurePass123!' })
      .expect(201);

    const driverToken = driverLogin.body.data.accessToken as string;

    const acceptedRide = {
      id: 'ride-1',
      riderId: 'rider-1',
      driverId: 'driver-1',
      pickupAddress: 'Tahrir',
      dropoffAddress: 'Maadi',
      pickupLat: 30.0444,
      pickupLng: 31.2357,
      dropoffLat: 30.0626,
      dropoffLng: 31.2497,
      status: RideStatus.ACCEPTED,
      fare: 50,
      distanceKm: 5,
      etaMinutes: 15,
      paymentMethodKey: null,
      rideTierKey: null,
      driverLat: null,
      driverLng: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rider: { id: 'rider-1', name: 'Rider', phone: '+201', avatarUrl: null },
      driver: {
        id: 'driver-1',
        name: 'Driver',
        phone: '+202',
        avatarUrl: null,
        driverProfile: {
          rating: 5,
          vehicle: { makeModel: 'Toyota', vehicleType: 'sedan' },
        },
      },
    };

    mockPrisma.ride.findUnique.mockResolvedValue({
      ...acceptedRide,
      status: RideStatus.REQUESTED,
      driverId: null,
    });
    mockPrisma.ride.update.mockResolvedValue(acceptedRide);
    mockPrisma.driverProfile.update.mockResolvedValue({});

    await request(app.getHttpServer())
      .post('/api/v1/driver/offers/ride-1/accept')
      .set('Authorization', `Bearer ${driverToken}`)
      .expect(201);

    mockPrisma.ride.findFirst.mockResolvedValue(acceptedRide);

    const active = await request(app.getHttpServer())
      .get('/api/trips/active')
      .set('Authorization', `Bearer ${riderToken}`)
      .expect(200);

    expect(active.body.status).toBe('accepted');
    expect(active.body.id).toBe('ride-1');
  });
});
