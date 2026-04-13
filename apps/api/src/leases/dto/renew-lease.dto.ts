import { IsDateString, IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentSchedule } from '../lease.entity';

export class RenewLeaseDto {
  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  rentAmount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  depositAmount: number;

  @ApiProperty({ enum: PaymentSchedule, default: PaymentSchedule.MONTHLY })
  @IsEnum(PaymentSchedule)
  paymentSchedule: PaymentSchedule;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(1)
  @Max(28)
  paymentDay: number;
}
