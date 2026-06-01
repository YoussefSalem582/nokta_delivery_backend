import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/auth.guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { toTripJson } from '../../common/mappers/status.mapper';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('v1/admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('users')
  @ApiOperation({ summary: 'List users' })
  async listUsers(@Query('role') role?: UserRole) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Patch('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate user' })
  deactivateUser(@Param('id') id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  }

  @Get('rides')
  @ApiOperation({ summary: 'List all rides' })
  async listRides() {
    const rides = await this.prisma.ride.findMany({
      include: {
        rider: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rides.map((ride) => toTripJson(ride as unknown as Parameters<typeof toTripJson>[0]));
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'List all deliveries' })
  listDeliveries() {
    return this.prisma.delivery.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Platform analytics overview' })
  async analytics() {
    const [users, rides, deliveries, completedRides] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.ride.count(),
      this.prisma.delivery.count(),
      this.prisma.ride.count({ where: { status: 'COMPLETED' } }),
    ]);

    return {
      users,
      rides,
      deliveries,
      completedRides,
      completionRate: rides > 0 ? Math.round((completedRides / rides) * 100) : 0,
    };
  }
}
