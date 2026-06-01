import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RidesService } from './rides.service';
import {
  EstimateFareDto,
  RequestRideDto,
  UpdateRideStatusDto,
} from './dto/ride.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Get('trips')
  @ApiOperation({ summary: 'List trips for current user' })
  listTrips(@CurrentUser() user: AuthUserPayload) {
    return this.ridesService.findAllForUser(user.sub, user.role);
  }

  @Get('trips/active')
  @ApiOperation({ summary: 'Get active trip for current user' })
  activeTrip(@CurrentUser() user: AuthUserPayload) {
    return this.ridesService.getActiveRide(user.sub);
  }

  @Get('trips/:id')
  @ApiOperation({ summary: 'Get trip by ID' })
  getTrip(@Param('id') id: string, @CurrentUser() user: AuthUserPayload) {
    return this.ridesService.findById(id, user.sub);
  }

  @Post('trips/request')
  @ApiOperation({ summary: 'Request a new trip' })
  requestTrip(@CurrentUser() user: AuthUserPayload, @Body() dto: RequestRideDto) {
    return this.ridesService.requestRide(user.sub, dto);
  }

  @Patch('trips/:id/status')
  @ApiOperation({ summary: 'Update trip status' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateRideStatusDto,
  ) {
    return this.ridesService.updateStatus(id, user.sub, dto);
  }

  @Post('rides/estimate-fare')
  @ApiOperation({ summary: 'Estimate ride fare' })
  estimateFare(@Body() dto: EstimateFareDto) {
    return this.ridesService.estimateFare(dto);
  }
}
