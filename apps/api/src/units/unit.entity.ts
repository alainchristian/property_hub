import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { Property } from '../properties/property.entity';
import { Lease } from '../leases/lease.entity';
import { MaintenanceRequest } from '../maintenance/maintenance-request.entity';

export enum UnitType {
  RESIDENTIAL = 'residential',
  COMMERCIAL  = 'commercial',
  OFFICE      = 'office',
  WAREHOUSE   = 'warehouse',
  RETAIL      = 'retail',
  MIXED       = 'mixed',
}

export enum UnitStatus {
  VACANT      = 'vacant',
  OCCUPIED    = 'occupied',
  MAINTENANCE = 'maintenance',
}

@Entity('units')
@Index(['propertyId', 'unitNumber'], { unique: true })
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => Property, (p) => p.units)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'unit_number' })
  unitNumber: string;

  @Column({ type: 'enum', enum: UnitType, default: UnitType.RESIDENTIAL })
  type: UnitType;

  @Column({ nullable: true })
  floor: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area: number;

  @Column({ name: 'rent_amount', type: 'decimal', precision: 12, scale: 2 })
  rentAmount: number;

  @Column({ type: 'enum', enum: UnitStatus, default: UnitStatus.VACANT })
  status: UnitStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Lease, (l) => l.unit)
  leases: Lease[];

  @OneToMany(() => MaintenanceRequest, (m) => m.unit)
  maintenanceRequests: MaintenanceRequest[];
}
