import {
  IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsNotEmpty, Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UnitStatus, UnitType } from '../unit.entity';

export class UpdateUnitDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unitNumber?: string;

  @ApiProperty({ enum: UnitType, required: false })
  @IsOptional()
  @IsEnum(UnitType)
  type?: UnitType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  floor?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  area?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rentAmount?: number;

  @ApiProperty({ enum: UnitStatus, required: false })
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
