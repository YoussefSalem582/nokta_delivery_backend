import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';

import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  check() {
    return {
      status: 'ok',
      service: 'nokta-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness check including database' })
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
