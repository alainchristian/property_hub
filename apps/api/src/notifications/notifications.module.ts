import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { SchedulerService } from './scheduler.service';
import { OverdueCheckProcessor } from './queues/overdue-check.processor';
import { RentReminderProcessor } from './queues/rent-reminder.processor';
import { LeaseExpiryProcessor } from './queues/lease-expiry.processor';
import { Payment } from '../payments/payment.entity';
import { Lease } from '../leases/lease.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Lease]),
    BullModule.registerQueue(
      { name: 'overdue-check' },
      { name: 'rent-reminders' },
      { name: 'lease-expiry' },
    ),
  ],
  providers: [
    EmailService,
    SchedulerService,
    OverdueCheckProcessor,
    RentReminderProcessor,
    LeaseExpiryProcessor,
  ],
  exports: [EmailService],
})
export class NotificationsModule {}
