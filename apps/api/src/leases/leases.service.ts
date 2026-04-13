import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lease, LeaseStatus, PaymentSchedule } from './lease.entity';
import { Unit, UnitStatus } from '../units/unit.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { RenewLeaseDto } from './dto/renew-lease.dto';

@Injectable()
export class LeasesService {
  constructor(
    @InjectRepository(Lease)
    private readonly leaseRepo: Repository<Lease>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  findAll(): Promise<Lease[]> {
    return this.leaseRepo.find({ relations: ['unit', 'tenant'], order: { createdAt: 'DESC' } });
  }

  findByUnit(unitId: string): Promise<Lease[]> {
    return this.leaseRepo.find({ where: { unitId }, relations: ['tenant'], order: { createdAt: 'DESC' } });
  }

  findByTenant(tenantId: string): Promise<Lease[]> {
    return this.leaseRepo.find({ where: { tenantId }, relations: ['unit'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Lease> {
    const lease = await this.leaseRepo.findOne({
      where: { id },
      relations: ['unit', 'tenant', 'payments'],
    });
    if (!lease) throw new NotFoundException('Lease not found');
    return lease;
  }

  async createLeaseWithPayments(dto: CreateLeaseDto): Promise<Lease> {
    const unit = await this.unitRepo.findOneByOrFail({ id: dto.unitId }).catch(() => {
      throw new NotFoundException('Unit not found');
    });

    if (unit.status !== UnitStatus.VACANT) {
      throw new ConflictException('Unit is not available');
    }

    const overlap = await this.leaseRepo.findOne({
      where: { unitId: dto.unitId, status: LeaseStatus.ACTIVE },
    });
    if (overlap) throw new ConflictException('Unit already has an active lease');

    const lease = await this.leaseRepo.save(
      this.leaseRepo.create({ ...dto, status: LeaseStatus.ACTIVE }),
    );

    const payments = this.generatePaymentSchedule(lease);
    await this.paymentRepo.save(payments);

    await this.unitRepo.update(dto.unitId, { status: UnitStatus.OCCUPIED });

    return this.findOne(lease.id);
  }

  async update(id: string, dto: UpdateLeaseDto): Promise<Lease> {
    await this.findOne(id);
    await this.leaseRepo.update(id, dto);
    return this.findOne(id);
  }

  async terminateLease(id: string, reason: string): Promise<Lease> {
    const lease = await this.findOne(id);
    await this.leaseRepo.update(id, {
      status: LeaseStatus.TERMINATED,
      terminationReason: reason,
    });
    await this.unitRepo.update(lease.unitId, { status: UnitStatus.VACANT });
    return this.findOne(id);
  }

  async renewLease(id: string, dto: RenewLeaseDto): Promise<Lease> {
    const old = await this.findOne(id);
    await this.leaseRepo.update(id, { status: LeaseStatus.EXPIRED });
    await this.unitRepo.update(old.unitId, { status: UnitStatus.VACANT });
    return this.createLeaseWithPayments({
      unitId: old.unitId,
      tenantId: old.tenantId,
      ...dto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.leaseRepo.delete(id);
  }

  private generatePaymentSchedule(lease: Lease): Partial<Payment>[] {
    const payments: Partial<Payment>[] = [];
    const start = new Date(lease.startDate);
    const end = new Date(lease.endDate);

    let current = new Date(start.getFullYear(), start.getMonth(), lease.paymentDay);
    if (current < start) current.setMonth(current.getMonth() + 1);

    while (current <= end) {
      payments.push({
        leaseId: lease.id,
        dueDate: new Date(current),
        amountDue: lease.rentAmount,
        status: PaymentStatus.PENDING,
      });

      if (lease.paymentSchedule === PaymentSchedule.MONTHLY) {
        current.setMonth(current.getMonth() + 1);
      } else if (lease.paymentSchedule === PaymentSchedule.QUARTERLY) {
        current.setMonth(current.getMonth() + 3);
      } else {
        current.setFullYear(current.getFullYear() + 1);
      }
    }

    return payments;
  }
}
