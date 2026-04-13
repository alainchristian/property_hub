import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PropertyType } from '../property.entity';

export class CreatePropertyDto {
  @ApiProperty()
  @IsUUID()
  ownerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ enum: PropertyType, default: PropertyType.RESIDENTIAL })
  @IsEnum(PropertyType)
  type: PropertyType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  acquisitionDate?: string;
}
