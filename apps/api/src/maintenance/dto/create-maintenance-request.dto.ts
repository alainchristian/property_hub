import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MaintenanceCategory, MaintenancePriority } from '../maintenance-request.entity';

export class CreateMaintenanceRequestDto {
  @ApiProperty()
  @IsUUID()
  unitId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: MaintenanceCategory, default: MaintenanceCategory.GENERAL })
  @IsEnum(MaintenanceCategory)
  category: MaintenanceCategory;

  @ApiProperty({ enum: MaintenancePriority, default: MaintenancePriority.MEDIUM })
  @IsEnum(MaintenancePriority)
  priority: MaintenancePriority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;
}
