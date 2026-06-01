import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncBatchDto } from './dto/sync.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('actions')
  @ApiOperation({ summary: 'Process queued offline actions' })
  syncActions(@CurrentUser() user: AuthUserPayload, @Body() dto: SyncBatchDto) {
    return this.syncService.processBatch(user.sub, dto.actions);
  }

  @Get('reconcile')
  @ApiOperation({ summary: 'Reconcile client state after reconnect' })
  reconcile(@CurrentUser() user: AuthUserPayload) {
    return this.syncService.reconcile(user.sub);
  }
}
