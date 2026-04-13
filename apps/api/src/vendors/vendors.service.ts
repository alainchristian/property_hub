import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly repo: Repository<Vendor>,
  ) {}

  findAll(): Promise<Vendor[]> {
    return this.repo.find({ order: { companyName: 'ASC' } });
  }

  findActive(): Promise<Vendor[]> {
    return this.repo.find({ where: { isActive: true }, order: { companyName: 'ASC' } });
  }

  async findOne(id: string): Promise<Vendor> {
    const vendor = await this.repo.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async create(dto: CreateVendorDto): Promise<Vendor> {
    const existing = await this.repo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered to a vendor');
    const vendor = this.repo.create(dto);
    return this.repo.save(vendor);
  }

  async update(id: string, dto: UpdateVendorDto): Promise<Vendor> {
    await this.findOne(id);
    if (dto.email) {
      const existing = await this.repo.findOne({ where: { email: dto.email } });
      if (existing && existing.id !== id) throw new ConflictException('Email already in use');
    }
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
