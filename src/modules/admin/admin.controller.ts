import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/auth.guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUserPayload } from '../../common/decorators/current-user.decorator';
import { ClientIp } from '../../common/decorators/client-ip.decorator';
import { toTripJson } from '../../common/mappers/status.mapper';
import { AuditService } from '../audit/audit.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('v1/admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

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
  async deactivateUser(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUserPayload,
    @ClientIp() ipAddress?: string,
  ) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true, email: true },
    });

    await this.auditService.log({
      userId: admin.sub,
      action: 'user.deactivate',
      entityType: 'user',
      entityId: id,
      metadata: { targetEmail: user.email },
      ipAddress,
    });

    return user;
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

  @Get('audit-logs')
  @ApiOperation({ summary: 'List recent audit logs for moderation' })
  auditLogs(@Query('entityType') entityType?: string, @Query('limit') limit?: string) {
    return this.auditService.findRecent(limit ? parseInt(limit, 10) : 50, entityType);
  }

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Platform analytics overview' })
  async analytics() {
    const [users, rides, deliveries, completedRides, auditCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.ride.count(),
      this.prisma.delivery.count(),
      this.prisma.ride.count({ where: { status: 'COMPLETED' } }),
      this.prisma.auditLog.count(),
    ]);

    return {
      users,
      rides,
      deliveries,
      completedRides,
      auditLogs: auditCount,
      completionRate: rides > 0 ? Math.round((completedRides / rides) * 100) : 0,
    };
  }
}
