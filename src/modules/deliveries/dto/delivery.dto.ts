import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeliveryDto {
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
  fee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  packageNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({ example: 'pickedUp' })
  @IsString()
  @IsNotEmpty()
  status!: string;
}

export class AssignCourierDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courierId!: string;
}
