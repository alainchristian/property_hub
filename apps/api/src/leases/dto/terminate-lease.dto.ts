import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TerminateLeaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
