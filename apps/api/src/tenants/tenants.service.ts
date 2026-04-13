import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  findAll(): Promise<Tenant[]> {
    return this.repo.find({ order: { lastName: 'ASC', firstName: 'ASC' } });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.repo.findOne({ where: { id }, relations: ['leases'] });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const existing = await this.repo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered to a tenant');

    const tenant = this.repo.create(dto);
    return this.repo.save(tenant);
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    await this.findOne(id);
    if (dto.email) {
      const existing = await this.repo.findOne({ where: { email: dto.email } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
