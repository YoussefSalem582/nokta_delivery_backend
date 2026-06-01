import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import {
  AssignCourierDto,
  CreateDeliveryDto,
  UpdateDeliveryStatusDto,
} from './dto/delivery.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/auth.guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('deliveries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create delivery request' })
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateDeliveryDto) {
    return this.deliveriesService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List deliveries for current user' })
  list(@CurrentUser() user: AuthUserPayload) {
    return this.deliveriesService.findAllForUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery by ID' })
  get(@Param('id') id: string, @CurrentUser() user: AuthUserPayload) {
    return this.deliveriesService.findById(id, user.sub);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign courier to delivery' })
  assign(@Param('id') id: string, @Body() dto: AssignCourierDto) {
    return this.deliveriesService.assignCourier(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update delivery status' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveriesService.updateStatus(id, user.sub, dto);
  }
}
