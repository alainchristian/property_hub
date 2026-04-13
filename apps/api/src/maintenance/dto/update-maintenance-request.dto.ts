import {
  IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MaintenanceCategory, MaintenancePriority, MaintenanceStatus } from '../maintenance-request.entity';

export class UpdateMaintenanceRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: MaintenanceCategory, required: false })
  @IsOptional()
  @IsEnum(MaintenanceCategory)
  category?: MaintenanceCategory;

  @ApiProperty({ enum: MaintenancePriority, required: false })
  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @ApiProperty({ enum: MaintenanceStatus, required: false })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  attachments?: string[];
}
