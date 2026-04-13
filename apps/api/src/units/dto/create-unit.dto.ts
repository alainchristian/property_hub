import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UnitType } from '../unit.entity';

export class CreateUnitDto {
  @ApiProperty()
  @IsUUID()
  propertyId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unitNumber: string;

  @ApiProperty({ enum: UnitType, default: UnitType.RESIDENTIAL })
  @IsEnum(UnitType)
  type: UnitType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  floor?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  area?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  rentAmount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
