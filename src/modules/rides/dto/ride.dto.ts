import {
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestRideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pickupAddress!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dropoffAddress!: string;

  @ApiProperty()
  @IsNumber()
  pickupLat!: number;

  @ApiProperty()
  @IsNumber()
  pickupLng!: number;

  @ApiProperty()
  @IsNumber()
  dropoffLat!: number;

  @ApiProperty()
  @IsNumber()
  dropoffLng!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fare?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  distanceKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  etaMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethodKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rideTierKey?: string;

  @ApiPropertyOptional({ description: 'Idempotency key for offline sync' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class UpdateRideStatusDto {
  @ApiProperty({ example: 'inProgress' })
  @IsString()
  @IsNotEmpty()
  status!: string;
}

export class EstimateFareDto {
  @ApiProperty()
  @IsNumber()
  pickupLat!: number;

  @ApiProperty()
  @IsNumber()
  pickupLng!: number;

  @ApiProperty()
  @IsNumber()
  dropoffLat!: number;

  @ApiProperty()
  @IsNumber()
  dropoffLng!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rideTierKey?: string;
}

export class UpdateLocationDto {
  @ApiProperty()
  @IsNumber()
  lat!: number;

  @ApiProperty()
  @IsNumber()
  lng!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  heading?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  speed?: number;
}
