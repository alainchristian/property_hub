import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum DocumentRefType {
  PROPERTY    = 'property',
  UNIT        = 'unit',
  LEASE       = 'lease',
  PAYMENT     = 'payment',
  MAINTENANCE = 'maintenance',
  TENANT      = 'tenant',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ref_type', type: 'enum', enum: DocumentRefType })
  refType: DocumentRefType;

  @Column({ name: 'ref_id' })
  refId: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ default: 1 })
  version: number;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
