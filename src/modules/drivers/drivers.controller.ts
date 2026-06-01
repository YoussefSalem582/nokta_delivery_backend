import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DriverRegisterDto,
  DriversService,
  UpdateAvailabilityDto,
} from './drivers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUserPayload } from '../../common/decorators/current-user.decorator';
import { UpdateLocationDto, UpdateRideStatusDto } from '../rides/dto/ride.dto';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get('drivers')
  @ApiOperation({ summary: 'List available drivers' })
  listDrivers() {
    return this.driversService.listDrivers();
  }

  @Post('v1/driver/register')
  @ApiOperation({ summary: 'Register as driver' })
  register(@CurrentUser() user: AuthUserPayload, @Body() dto: DriverRegisterDto) {
    return this.driversService.registerDriver(user.sub, dto);
  }

  @Get('v1/driver/profile')
  @ApiOperation({ summary: 'Get driver profile' })
  profile(@CurrentUser() user: AuthUserPayload) {
    return this.driversService.getProfile(user.sub);
  }

  @Patch('v1/driver/availability')
  @ApiOperation({ summary: 'Update driver availability' })
  availability(@CurrentUser() user: AuthUserPayload, @Body() dto: UpdateAvailabilityDto) {
    return this.driversService.updateAvailability(user.sub, dto);
  }

  @Get('v1/driver/offers')
  @ApiOperation({ summary: 'Get pending ride offers' })
  offers(@CurrentUser() user: AuthUserPayload) {
    return this.driversService.getOffers(user.sub);
  }

  @Post('v1/driver/offers/:tripId/accept')
  @ApiOperation({ summary: 'Accept a ride offer' })
  acceptOffer(@CurrentUser() user: AuthUserPayload, @Param('tripId') tripId: string) {
    return this.driversService.acceptOffer(user.sub, tripId);
  }

  @Post('v1/driver/offers/:tripId/decline')
  @ApiOperation({ summary: 'Decline a ride offer' })
  declineOffer(@CurrentUser() user: AuthUserPayload, @Param('tripId') tripId: string) {
    return this.driversService.declineOffer(user.sub, tripId);
  }

  @Patch('v1/driver/trips/:tripId/status')
  @ApiOperation({ summary: 'Update trip status as driver' })
  updateTripStatus(
    @CurrentUser() user: AuthUserPayload,
    @Param('tripId') tripId: string,
    @Body() dto: UpdateRideStatusDto,
  ) {
    return this.driversService.updateTripStatus(user.sub, tripId, dto);
  }

  @Patch('v1/driver/trips/:tripId/location')
  @ApiOperation({ summary: 'Update driver location during trip' })
  updateTripLocation(
    @CurrentUser() user: AuthUserPayload,
    @Param('tripId') tripId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.driversService.updateTripLocation(user.sub, tripId, dto);
  }
}
