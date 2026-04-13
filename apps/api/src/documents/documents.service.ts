import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentRefType } from './document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly repo: Repository<Document>,
  ) {}

  findAll(): Promise<Document[]> {
    return this.repo.find({ order: { uploadedAt: 'DESC' } });
  }

  findByRef(refType: DocumentRefType, refId: string): Promise<Document[]> {
    return this.repo.find({ where: { refType, refId }, order: { uploadedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Document> {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async create(dto: CreateDocumentDto): Promise<Document> {
    const doc = this.repo.create(dto);
    return this.repo.save(doc);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
