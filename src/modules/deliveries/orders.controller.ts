import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class OrdersController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get('orders')
  @ApiOperation({ summary: 'List orders (Flutter-compatible alias for deliveries)' })
  listOrders(@CurrentUser() user: AuthUserPayload) {
    return this.deliveriesService.findAllForUser(user.sub);
  }
}
