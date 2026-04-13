import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './unit.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit)
    private readonly repo: Repository<Unit>,
  ) {}

  findAll(): Promise<Unit[]> {
    return this.repo.find({ relations: ['property'], order: { unitNumber: 'ASC' } });
  }

  findByProperty(propertyId: string): Promise<Unit[]> {
    return this.repo.find({ where: { propertyId }, order: { unitNumber: 'ASC' } });
  }

  async findOne(id: string): Promise<Unit> {
    const unit = await this.repo.findOne({ where: { id }, relations: ['property'] });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async create(dto: CreateUnitDto): Promise<Unit> {
    const unit = this.repo.create(dto);
    return this.repo.save(unit);
  }

  async update(id: string, dto: UpdateUnitDto): Promise<Unit> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
