import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MessageKeys } from '../../common/messages/message-keys';
import { buildErrorResponse, buildResponse } from '../../common/responses/api-response';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDeviceTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.accessSecret = configService.get<string>('jwt.accessSecret')!;
    this.refreshSecret = configService.get<string>('jwt.refreshSecret')!;
    this.accessExpiresIn = configService.get<string>('jwt.accessExpiresIn', '15m');
    this.refreshExpiresIn = configService.get<string>('jwt.refreshExpiresIn', '7d');
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(buildErrorResponse(MessageKeys.AUTH.EMAIL_EXISTS));
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role = dto.role ?? UserRole.RIDER;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role,
        riderProfile: role === UserRole.RIDER ? { create: {} } : undefined,
        driverProfile:
          role === UserRole.DRIVER || role === UserRole.COURIER
            ? { create: {} }
            : undefined,
      },
    });

    const tokens = await this.issueTokens(user);
    return buildResponse(MessageKeys.AUTH.REGISTER_SUCCESS, {
      user: this.toUserResponse(user),
      ...tokens,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException(buildErrorResponse(MessageKeys.AUTH.INVALID_CREDENTIALS));
    }

    const tokens = await this.issueTokens(user);
    return buildResponse(MessageKeys.AUTH.LOGIN_SUCCESS, {
      user: this.toUserResponse(user),
      ...tokens,
    });
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify<{ sub: string }>(dto.refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(buildErrorResponse(MessageKeys.AUTH.TOKEN_INVALID));
    }

    const tokenHash = this.hashToken(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!stored) {
      throw new UnauthorizedException(buildErrorResponse(MessageKeys.AUTH.TOKEN_INVALID));
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException(buildErrorResponse(MessageKeys.AUTH.TOKEN_INVALID));
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(user);
    return buildResponse(MessageKeys.AUTH.REFRESH_SUCCESS, tokens);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return buildResponse(MessageKeys.AUTH.LOGOUT_SUCCESS);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (user) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await this.prisma.passwordResetToken.create({
        data: { email: dto.email, tokenHash, expiresAt },
      });

      // In production, send email with rawToken. Log for dev/demo.
      console.log(`[dev] Password reset token for ${dto.email}: ${rawToken}`);
    }

    return buildResponse(MessageKeys.AUTH.FORGOT_PASSWORD_SENT);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      throw new BadRequestException(buildErrorResponse(MessageKeys.AUTH.TOKEN_INVALID));
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email: resetToken.email },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return buildResponse(MessageKeys.AUTH.PASSWORD_RESET_SUCCESS);
  }

  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: { userId, token: dto.token, platform: dto.platform },
      update: { userId, platform: dto.platform },
    });

    return buildResponse(MessageKeys.COMMON.SUCCESS, { registered: true });
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshDays = this.parseExpiryDays(this.refreshExpiresIn);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiryDays(expiry: string): number {
    const match = /^(\d+)([dhms])$/.exec(expiry);
    if (!match) return 7;
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 'd':
        return value;
      case 'h':
        return value / 24;
      case 'm':
        return value / (24 * 60);
      default:
        return 7;
    }
  }

  toUserResponse(user: User & { driverProfile?: { isRegistered: boolean } | null }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      walletBalance: Number(user.walletBalance),
      avatarUrl: user.avatarUrl,
      role: user.role,
      isDriverRegistered: user.driverProfile?.isRegistered ?? false,
    };
  }
}
