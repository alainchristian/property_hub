import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { LeasesService } from './leases.service';
import { Lease, LeaseStatus, PaymentSchedule } from './lease.entity';
import { Unit, UnitStatus } from '../units/unit.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';

// ─── Mock factories ───────────────────────────────────────────────────────────

const mockLeaseRepo = () => ({
  find:         jest.fn(),
  findOne:      jest.fn(),
  findOneByOrFail: jest.fn(),
  create:       jest.fn(),
  save:         jest.fn(),
  update:       jest.fn(),
  delete:       jest.fn(),
});

const mockUnitRepo = () => ({
  findOneByOrFail: jest.fn(),
  update:          jest.fn(),
});

const mockPaymentRepo = () => ({
  save: jest.fn(),
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeLease(overrides: Partial<Lease> = {}): Lease {
  return {
    id:              'lease-uuid',
    unitId:          'unit-uuid',
    tenantId:        'tenant-uuid',
    startDate:       new Date('2024-01-01') as any,
    endDate:         new Date('2024-12-31') as any,
    rentAmount:      1500,
    depositAmount:   3000,
    paymentSchedule: PaymentSchedule.MONTHLY,
    paymentDay:      15,
    status:          LeaseStatus.ACTIVE,
    terminationReason: null as any,
    notes:           null as any,
    unit:            null as any,
    tenant:          null as any,
    payments:        [],
    createdAt:       new Date(),
    updatedAt:       new Date(),
    ...overrides,
  };
}

const vacantUnit = {
  id:     'unit-uuid',
  status: UnitStatus.VACANT,
} as Unit;

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('LeasesService', () => {
  let service: LeasesService;
  let leaseRepo: ReturnType<typeof mockLeaseRepo>;
  let unitRepo:  ReturnType<typeof mockUnitRepo>;
  let paymentRepo: ReturnType<typeof mockPaymentRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeasesService,
        { provide: getRepositoryToken(Lease),   useFactory: mockLeaseRepo   },
        { provide: getRepositoryToken(Unit),    useFactory: mockUnitRepo    },
        { provide: getRepositoryToken(Payment), useFactory: mockPaymentRepo },
      ],
    }).compile();

    service     = module.get<LeasesService>(LeasesService);
    leaseRepo   = module.get(getRepositoryToken(Lease));
    unitRepo    = module.get(getRepositoryToken(Unit));
    paymentRepo = module.get(getRepositoryToken(Payment));
  });

  afterEach(() => jest.clearAllMocks());

  // ── generatePaymentSchedule (private) ─────────────────────────────────────

  describe('generatePaymentSchedule', () => {
    it('generates 12 payments for a monthly annual lease', () => {
      const lease = makeLease({ paymentSchedule: PaymentSchedule.MONTHLY });
      const payments: Partial<Payment>[] = (service as any)['generatePaymentSchedule'](lease);
      expect(payments).toHaveLength(12);
      payments.forEach((p) => {
        expect(p.amountDue).toBe(1500);
        expect(p.status).toBe(PaymentStatus.PENDING);
        expect(p.leaseId).toBe('lease-uuid');
      });
    });

    it('generates 4 payments for a quarterly annual lease', () => {
      const lease = makeLease({ paymentSchedule: PaymentSchedule.QUARTERLY });
      const payments: Partial<Payment>[] = (service as any)['generatePaymentSchedule'](lease);
      expect(payments).toHaveLength(4);
    });

    it('generates 1 payment for a yearly annual lease', () => {
      const lease = makeLease({ paymentSchedule: PaymentSchedule.YEARLY });
      const payments: Partial<Payment>[] = (service as any)['generatePaymentSchedule'](lease);
      expect(payments).toHaveLength(1);
    });

    it('due dates are sorted chronologically', () => {
      const lease = makeLease({ paymentSchedule: PaymentSchedule.MONTHLY });
      const payments: Partial<Payment>[] = (service as any)['generatePaymentSchedule'](lease);
      for (let i = 1; i < payments.length; i++) {
        expect(payments[i].dueDate!.getTime()).toBeGreaterThan(payments[i - 1].dueDate!.getTime());
      }
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the lease when found', async () => {
      const lease = makeLease();
      leaseRepo.findOne.mockResolvedValue(lease);
      const result = await service.findOne('lease-uuid');
      expect(result).toEqual(lease);
    });

    it('throws NotFoundException when lease is missing', async () => {
      leaseRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  // ── createLeaseWithPayments ───────────────────────────────────────────────

  describe('createLeaseWithPayments', () => {
    const dto = {
      unitId:          'unit-uuid',
      tenantId:        'tenant-uuid',
      startDate:       '2024-01-01' as any,
      endDate:         '2024-12-31' as any,
      rentAmount:      1500,
      depositAmount:   3000,
      paymentSchedule: PaymentSchedule.MONTHLY,
      paymentDay:      15,
    };

    it('throws NotFoundException when unit does not exist', async () => {
      unitRepo.findOneByOrFail.mockRejectedValue(new Error('not found'));
      await expect(service.createLeaseWithPayments(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when unit is not vacant', async () => {
      unitRepo.findOneByOrFail.mockResolvedValue({ ...vacantUnit, status: UnitStatus.OCCUPIED });
      await expect(service.createLeaseWithPayments(dto)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when an active lease already exists for the unit', async () => {
      unitRepo.findOneByOrFail.mockResolvedValue(vacantUnit);
      leaseRepo.findOne.mockResolvedValue(makeLease()); // existing active lease
      await expect(service.createLeaseWithPayments(dto)).rejects.toThrow(ConflictException);
    });

    it('creates a lease and generates a payment schedule on success', async () => {
      const savedLease = makeLease();
      unitRepo.findOneByOrFail.mockResolvedValue(vacantUnit);
      leaseRepo.findOne
        .mockResolvedValueOnce(null)        // no overlap
        .mockResolvedValueOnce(savedLease); // final findOne call
      leaseRepo.create.mockReturnValue(savedLease);
      leaseRepo.save.mockResolvedValue(savedLease);
      paymentRepo.save.mockResolvedValue([]);
      unitRepo.update.mockResolvedValue(undefined);

      const result = await service.createLeaseWithPayments(dto);
      expect(leaseRepo.save).toHaveBeenCalled();
      expect(paymentRepo.save).toHaveBeenCalled();
      expect(unitRepo.update).toHaveBeenCalledWith('unit-uuid', { status: UnitStatus.OCCUPIED });
      expect(result).toEqual(savedLease);
    });
  });

  // ── terminateLease ────────────────────────────────────────────────────────

  describe('terminateLease', () => {
    it('sets lease status to TERMINATED and marks unit VACANT', async () => {
      const lease = makeLease();
      leaseRepo.findOne
        .mockResolvedValueOnce(lease)  // first findOne in terminateLease
        .mockResolvedValueOnce(lease); // final findOne return
      leaseRepo.update.mockResolvedValue(undefined);
      unitRepo.update.mockResolvedValue(undefined);

      await service.terminateLease('lease-uuid', 'Non-payment');
      expect(leaseRepo.update).toHaveBeenCalledWith(
        'lease-uuid',
        expect.objectContaining({ status: LeaseStatus.TERMINATED }),
      );
      expect(unitRepo.update).toHaveBeenCalledWith('unit-uuid', { status: UnitStatus.VACANT });
    });

    it('throws NotFoundException for a missing lease', async () => {
      leaseRepo.findOne.mockResolvedValue(null);
      await expect(service.terminateLease('bad-id', 'reason')).rejects.toThrow(NotFoundException);
    });
  });
});
