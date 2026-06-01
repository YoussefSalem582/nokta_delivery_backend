import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProfileController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile (Flutter-compatible)' })
  async getProfile(@CurrentUser() user: AuthUserPayload) {
    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.sub },
      include: { driverProfile: { include: { vehicle: true } } },
    });

    const dp = record.driverProfile;
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      phone: record.phone,
      walletBalance: Number(record.walletBalance),
      avatarUrl: record.avatarUrl,
      isDriverRegistered: dp?.isRegistered ?? false,
      driverProfile: dp?.isRegistered
        ? {
            phone: record.phone,
            vehicleType: dp.vehicle?.vehicleType,
            vehicleMakeModel: dp.vehicle?.makeModel,
            licensePlate: dp.vehicle?.licensePlate,
            registeredAt: dp.registeredAt?.toISOString(),
            termsAccepted: true,
          }
        : undefined,
    };
  }

  @Get('riders')
  @ApiOperation({ summary: 'List riders (admin/demo)' })
  async listRiders() {
    const riders = await this.prisma.user.findMany({
      where: { role: UserRole.RIDER },
      select: {
        id: true,
        name: true,
        phone: true,
        walletBalance: true,
        avatarUrl: true,
      },
      take: 50,
    });

    return riders.map((r) => ({
      ...r,
      walletBalance: Number(r.walletBalance),
    }));
  }
}
