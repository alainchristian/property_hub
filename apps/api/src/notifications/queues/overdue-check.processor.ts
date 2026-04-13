import { Processor, Process } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Payment, PaymentStatus } from '../../payments/payment.entity';
import { EmailService } from '../email.service';

@Processor('overdue-check')
export class OverdueCheckProcessor {
  private readonly logger = new Logger(OverdueCheckProcessor.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly emailService: EmailService,
  ) {}

  @Process()
  async handleOverdue() {
    this.logger.log('Running overdue payment check...');
    const LATE_FEE_RATE = 0.05; // 5% of amount due

    const overduePayments = await this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.lease', 'lease')
      .leftJoinAndSelect('lease.tenant', 'tenant')
      .where('p.status = :status', { status: PaymentStatus.PENDING })
      .andWhere('p.due_date < NOW()')
      .getMany();

    this.logger.log(`Found ${overduePayments.length} overdue payments`);

    for (const payment of overduePayments) {
      const lateFee = Number(payment.amountDue) * LATE_FEE_RATE;
      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.OVERDUE,
        lateFee,
      });

      if (payment.lease?.tenant?.email) {
        await this.emailService.sendOverdueNotice(payment.lease.tenant.email, {
          tenantName: `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`,
          amountDue: payment.amountDue,
          lateFee,
          dueDate: payment.dueDate,
        });
      }
    }

    this.logger.log('Overdue check complete');
  }
}
