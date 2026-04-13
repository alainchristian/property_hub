import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeasesService } from './leases.service';
import { LeasesController } from './leases.controller';
import { Lease } from './lease.entity';
import { Unit } from '../units/unit.entity';
import { Payment } from '../payments/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lease, Unit, Payment])],
  providers: [LeasesService],
  controllers: [LeasesController],
  exports: [LeasesService],
})
export class LeasesModule {}
