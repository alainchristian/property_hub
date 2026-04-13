import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Unit } from '../units/unit.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Vendor } from '../vendors/vendor.entity';

export enum MaintenancePriority {
  LOW    = 'low',
  MEDIUM = 'medium',
  HIGH   = 'high',
  URGENT = 'urgent',
}

export enum MaintenanceStatus {
  SUBMITTED   = 'submitted',
  ASSIGNED    = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED   = 'completed',
  CANCELLED   = 'cancelled',
}

export enum MaintenanceCategory {
  PLUMBING    = 'plumbing',
  ELECTRICAL  = 'electrical',
  HVAC        = 'hvac',
  STRUCTURAL  = 'structural',
  CLEANING    = 'cleaning',
  SECURITY    = 'security',
  GENERAL     = 'general',
}

@Entity('maintenance_requests')
export class MaintenanceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'unit_id' })
  unitId: string;

  @ManyToOne(() => Unit, (u) => u.maintenanceRequests)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'vendor_id', nullable: true })
  vendorId: string;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: MaintenanceCategory, default: MaintenanceCategory.GENERAL })
  category: MaintenanceCategory;

  @Column({ type: 'enum', enum: MaintenancePriority, default: MaintenancePriority.MEDIUM })
  priority: MaintenancePriority;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.SUBMITTED })
  status: MaintenanceStatus;

  @Column({ name: 'estimated_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ name: 'actual_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualCost: number;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'jsonb', default: [] })
  attachments: string[];

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
