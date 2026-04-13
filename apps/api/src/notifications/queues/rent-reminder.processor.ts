import { Processor, Process } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Payment, PaymentStatus } from '../../payments/payment.entity';
import { EmailService } from '../email.service';

@Processor('rent-reminders')
export class RentReminderProcessor {
  private readonly logger = new Logger(RentReminderProcessor.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly emailService: EmailService,
  ) {}

  @Process()
  async handleReminders() {
    this.logger.log('Running rent reminder check...');

    // Remind tenants 5 days before due date
    const today = new Date();
    const in5Days = new Date();
    in5Days.setDate(today.getDate() + 5);

    const upcomingPayments = await this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.lease', 'lease')
      .leftJoinAndSelect('lease.tenant', 'tenant')
      .leftJoinAndSelect('lease.unit', 'unit')
      .leftJoinAndSelect('unit.property', 'property')
      .where('p.status = :status', { status: PaymentStatus.PENDING })
      .andWhere('p.due_date BETWEEN :today AND :in5Days', {
        today: today.toISOString().split('T')[0],
        in5Days: in5Days.toISOString().split('T')[0],
      })
      .getMany();

    this.logger.log(`Found ${upcomingPayments.length} upcoming payments to remind`);

    for (const payment of upcomingPayments) {
      if (payment.lease?.tenant?.email) {
        await this.emailService.sendRentReminder(payment.lease.tenant.email, {
          tenantName: `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`,
          amountDue: payment.amountDue,
          dueDate: payment.dueDate,
          unitNumber: payment.lease.unit?.unitNumber ?? 'N/A',
          propertyName: payment.lease.unit?.property?.name ?? 'N/A',
        });
      }
    }

    this.logger.log('Rent reminder check complete');
  }
}
