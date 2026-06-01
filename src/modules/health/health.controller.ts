import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { PrismaService } from '../../database/prisma.service';
import { REDIS_CLIENT } from '../../database/redis.constants';
import { Public } from '../../common/decorators/roles.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

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
  @ApiOperation({ summary: 'Readiness check including database and Redis' })
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const redisPing = String(await this.redis.ping());
      if (redisPing !== 'PONG') {
        throw new Error('Unexpected Redis PING response');
      }

      return {
        status: 'ready',
        database: 'connected',
        redis: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        database: 'unknown',
        redis: 'unknown',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Readiness check failed',
      });
    }
  }
}
