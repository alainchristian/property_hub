import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaseStatus, PaymentSchedule } from '../lease.entity';

export class UpdateLeaseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rentAmount?: number;

  @ApiProperty({ enum: PaymentSchedule, required: false })
  @IsOptional()
  @IsEnum(PaymentSchedule)
  paymentSchedule?: PaymentSchedule;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(28)
  paymentDay?: number;

  @ApiProperty({ enum: LeaseStatus, required: false })
  @IsOptional()
  @IsEnum(LeaseStatus)
  status?: LeaseStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
