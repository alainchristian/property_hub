import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Unit } from '../units/unit.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Payment } from '../payments/payment.entity';

export enum LeaseStatus {
  PENDING    = 'pending',
  ACTIVE     = 'active',
  EXPIRED    = 'expired',
  TERMINATED = 'terminated',
}

export enum PaymentSchedule {
  MONTHLY   = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY    = 'yearly',
}

@Entity('leases')
export class Lease {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'unit_id' })
  unitId: string;

  @ManyToOne(() => Unit, (u) => u.leases)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, (t) => t.leases)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'rent_amount', type: 'decimal', precision: 12, scale: 2 })
  rentAmount: number;

  @Column({ name: 'deposit_amount', type: 'decimal', precision: 12, scale: 2 })
  depositAmount: number;

  @Column({
    name: 'payment_schedule',
    type: 'enum',
    enum: PaymentSchedule,
    default: PaymentSchedule.MONTHLY,
  })
  paymentSchedule: PaymentSchedule;

  @Column({ name: 'payment_day', default: 1 })
  paymentDay: number;

  @Column({ type: 'enum', enum: LeaseStatus, default: LeaseStatus.PENDING })
  status: LeaseStatus;

  @Column({ name: 'termination_reason', type: 'text', nullable: true })
  terminationReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => Payment, (p) => p.lease, { cascade: true })
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
