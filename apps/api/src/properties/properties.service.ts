import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly repo: Repository<Property>,
  ) {}

  findAll(): Promise<Property[]> {
    return this.repo.find({ relations: ['owner', 'units'], order: { createdAt: 'DESC' } });
  }

  findByOwner(ownerId: string): Promise<Property[]> {
    return this.repo.find({ where: { ownerId }, relations: ['units'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Property> {
    const property = await this.repo.findOne({ where: { id }, relations: ['owner', 'units'] });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async create(dto: CreatePropertyDto): Promise<Property> {
    const property = this.repo.create(dto);
    return this.repo.save(property);
  }

  async update(id: string, dto: UpdatePropertyDto): Promise<Property> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
