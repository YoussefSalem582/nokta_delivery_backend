import { IsArray, IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SyncActionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clientActionId!: string;

  @ApiProperty({ example: 'ride.request' })
  @IsString()
  @IsNotEmpty()
  actionType!: string;

  @ApiProperty()
  @IsObject()
  payload!: Record<string, unknown>;
}

export class SyncBatchDto {
  @ApiProperty({ type: [SyncActionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncActionDto)
  actions!: SyncActionDto[];
}
