import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(): Promise<Omit<User, 'passwordHash' | 'refreshToken'>[]> {
    const users = await this.repo.find({ order: { createdAt: 'DESC' } });
    return users.map((u) => this.sanitize(u));
  }

  async findOne(id: string): Promise<Omit<User, 'passwordHash' | 'refreshToken'>> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'passwordHash' | 'refreshToken'>> {
    const existing = await this.repo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({ ...dto, passwordHash });
    await this.repo.save(user);
    return this.sanitize(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<Omit<User, 'passwordHash' | 'refreshToken'>> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  private sanitize(user: User) {
    const { passwordHash, refreshToken, ...rest } = user;
    return rest;
  }
}
