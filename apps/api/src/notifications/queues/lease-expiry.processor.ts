import { Processor, Process } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Lease, LeaseStatus } from '../../leases/lease.entity';
import { EmailService } from '../email.service';

@Processor('lease-expiry')
export class LeaseExpiryProcessor {
  private readonly logger = new Logger(LeaseExpiryProcessor.name);

  constructor(
    @InjectRepository(Lease)
    private readonly leaseRepo: Repository<Lease>,
    private readonly emailService: EmailService,
  ) {}

  @Process()
  async handleLeaseExpiry() {
    this.logger.log('Running lease expiry check...');

    const today = new Date();
    const in60Days = new Date();
    in60Days.setDate(today.getDate() + 60);

    const expiringLeases = await this.leaseRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.tenant', 'tenant')
      .leftJoinAndSelect('l.unit', 'unit')
      .leftJoinAndSelect('unit.property', 'property')
      .where('l.status = :status', { status: LeaseStatus.ACTIVE })
      .andWhere('l.end_date BETWEEN :today AND :in60Days', {
        today: today.toISOString().split('T')[0],
        in60Days: in60Days.toISOString().split('T')[0],
      })
      .getMany();

    this.logger.log(`Found ${expiringLeases.length} leases expiring within 60 days`);

    for (const lease of expiringLeases) {
      if (lease.tenant?.email) {
        const endDate = new Date(lease.endDate);
        const daysRemaining = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        await this.emailService.sendLeaseExpiryNotice(lease.tenant.email, {
          tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          endDate: lease.endDate,
          unitNumber: lease.unit?.unitNumber ?? 'N/A',
          propertyName: lease.unit?.property?.name ?? 'N/A',
          daysRemaining,
        });
      }
    }

    this.logger.log('Lease expiry check complete');
  }
}
