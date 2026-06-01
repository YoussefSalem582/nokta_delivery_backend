import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    deviceToken: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('signed-token'),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const map: Record<string, string> = {
                'jwt.accessSecret': 'access-secret',
                'jwt.refreshSecret': 'refresh-secret',
                'jwt.accessExpiresIn': '15m',
                'jwt.refreshExpiresIn': '7d',
              };
              return map[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  it('registers a new user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      phone: '+201000000000',
      walletBalance: 0,
      avatarUrl: null,
      role: UserRole.RIDER,
      driverProfile: null,
    });
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const result = await service.register({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+201000000000',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    expect(result.data?.user.email).toBe('test@example.com');
    expect(mockPrisma.user.create).toHaveBeenCalled();
  });

  it('rejects duplicate email on register', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.register({
        name: 'Test',
        email: 'test@example.com',
        phone: '+201000000000',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    const hash = await bcrypt.hash('password123', 12);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: hash,
      name: 'Test',
      phone: '+201000000000',
      walletBalance: 0,
      avatarUrl: null,
      role: UserRole.RIDER,
      driverProfile: null,
    });
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const result = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    expect(result.data?.accessToken).toBeDefined();
  });

  it('rejects invalid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(service.login({ email: 'wrong@example.com', password: 'bad' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
