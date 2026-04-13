import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { MaintenanceRequest } from '../maintenance/maintenance-request.entity';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_name' })
  companyName: string;

  @Column({ name: 'contact_name' })
  contactName: string;

  @Column()
  phone: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'services_offered', type: 'jsonb', default: [] })
  servicesOffered: string[];

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => MaintenanceRequest, (m) => m.vendor)
  maintenanceRequests: MaintenanceRequest[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
