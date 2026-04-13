import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceRequest, MaintenanceStatus } from './maintenance-request.entity';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateMaintenanceRequestDto } from './dto/update-maintenance-request.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRequest)
    private readonly repo: Repository<MaintenanceRequest>,
  ) {}

  findAll(): Promise<MaintenanceRequest[]> {
    return this.repo.find({ relations: ['unit', 'tenant', 'vendor'], order: { submittedAt: 'DESC' } });
  }

  findByUnit(unitId: string): Promise<MaintenanceRequest[]> {
    return this.repo.find({ where: { unitId }, relations: ['tenant', 'vendor'], order: { submittedAt: 'DESC' } });
  }

  findByTenant(tenantId: string): Promise<MaintenanceRequest[]> {
    return this.repo.find({ where: { tenantId }, relations: ['unit', 'vendor'], order: { submittedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<MaintenanceRequest> {
    const req = await this.repo.findOne({
      where: { id },
      relations: ['unit', 'tenant', 'vendor'],
    });
    if (!req) throw new NotFoundException('Maintenance request not found');
    return req;
  }

  async create(dto: CreateMaintenanceRequestDto): Promise<MaintenanceRequest> {
    const req = this.repo.create(dto);
    return this.repo.save(req);
  }

  async update(id: string, dto: UpdateMaintenanceRequestDto): Promise<MaintenanceRequest> {
    await this.findOne(id);
    const updates: Partial<MaintenanceRequest> = { ...dto };
    if (dto.status === MaintenanceStatus.COMPLETED && !updates.completedAt) {
      updates.completedAt = new Date();
    }
    await this.repo.update(id, updates);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
