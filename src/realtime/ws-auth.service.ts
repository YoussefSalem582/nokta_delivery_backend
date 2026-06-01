import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import type { JwtPayload } from '../modules/auth/jwt.strategy';

export interface WsUserPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class WsAuthService {
  private readonly accessSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.accessSecret = configService.get<string>('jwt.accessSecret')!;
  }

  async authenticateToken(token: string | undefined): Promise<WsUserPayload | null> {
    if (!token?.trim()) {
      return null;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.accessSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!user?.isActive) {
        return null;
      }

      return { sub: user.id, email: user.email, role: user.role };
    } catch {
      return null;
    }
  }

  async canJoinRide(userId: string, rideId: string): Promise<boolean> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      select: { riderId: true, driverId: true },
    });

    if (!ride) {
      return false;
    }

    return ride.riderId === userId || ride.driverId === userId;
  }
}
