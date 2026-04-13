import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Unit } from '../units/unit.entity';

export enum PropertyType {
  RESIDENTIAL = 'residential',
  COMMERCIAL  = 'commercial',
  MIXED       = 'mixed',
}

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User, (u) => u.properties)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'enum', enum: PropertyType, default: PropertyType.RESIDENTIAL })
  type: PropertyType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'acquisition_date', type: 'date', nullable: true })
  acquisitionDate: Date;

  @OneToMany(() => Unit, (u) => u.property)
  units: Unit[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
