import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Lease } from '../leases/lease.entity';

export enum PaymentStatus {
  PENDING  = 'pending',
  PAID     = 'paid',
  OVERDUE  = 'overdue',
  PARTIAL  = 'partial',
}

export enum PaymentMethod {
  ONLINE        = 'online',
  CASH          = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY  = 'mobile_money',
  CHECK         = 'check',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lease_id' })
  leaseId: string;

  @ManyToOne(() => Lease, (l) => l.payments)
  @JoinColumn({ name: 'lease_id' })
  lease: Lease;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ name: 'amount_due', type: 'decimal', precision: 12, scale: 2 })
  amountDue: number;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 12, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ name: 'payment_date', type: 'timestamp', nullable: true })
  paymentDate: Date;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  method: PaymentMethod;

  @Column({ name: 'late_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  lateFee: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'stripe_payment_intent_id', nullable: true })
  stripePaymentIntentId: string;

  @Column({ name: 'receipt_number', nullable: true })
  receiptNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
