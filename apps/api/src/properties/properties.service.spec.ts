import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { Property } from './property.entity';

// ─── Mock factory ─────────────────────────────────────────────────────────────

const mockRepo = () => ({
  find:       jest.fn(),
  findOne:    jest.fn(),
  create:     jest.fn(),
  save:       jest.fn(),
  update:     jest.fn(),
  delete:     jest.fn(),
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const property: Property = {
  id:              'prop-uuid',
  name:            'Sunrise Apartments',
  address:         '123 Main St',
  type:            'residential' as any,
  ownerId:         'owner-uuid',
  owner:           null as any,
  description:     null as any,
  acquisitionDate: null as any,
  units:           [],
  createdAt:       new Date(),
  updatedAt:       new Date(),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('PropertiesService', () => {
  let service: PropertiesService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: getRepositoryToken(Property), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    repo    = module.get(getRepositoryToken(Property));
  });

  afterEach(() => jest.clearAllMocks());

  // ── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all properties with owner and units relations', async () => {
      repo.find.mockResolvedValue([property]);
      const result = await service.findAll();
      expect(result).toEqual([property]);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['owner', 'units'] }),
      );
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the property when found', async () => {
      repo.findOne.mockResolvedValue(property);
      const result = await service.findOne('prop-uuid');
      expect(result).toEqual(property);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates and saves a new property', async () => {
      const dto = { name: 'New Prop', address: '1 St', type: 'residential' as any, ownerId: 'o1' };
      repo.create.mockReturnValue({ ...property, ...dto });
      repo.save.mockResolvedValue({ ...property, ...dto });
      const result = await service.create(dto);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalled();
      expect(result.name).toBe('New Prop');
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates and returns the property', async () => {
      repo.findOne.mockResolvedValue(property);
      repo.update.mockResolvedValue(undefined);
      const result = await service.update('prop-uuid', { name: 'Renamed' });
      expect(repo.update).toHaveBeenCalledWith('prop-uuid', { name: 'Renamed' });
      expect(result).toEqual(property);
    });

    it('throws NotFoundException if property does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update('bad-id', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes the property', async () => {
      repo.findOne.mockResolvedValue(property);
      repo.delete.mockResolvedValue(undefined);
      await service.remove('prop-uuid');
      expect(repo.delete).toHaveBeenCalledWith('prop-uuid');
    });

    it('throws NotFoundException if property does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
