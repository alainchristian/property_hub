import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { Payment, PaymentStatus, PaymentMethod } from './payment.entity';

// ─── Mock factory ─────────────────────────────────────────────────────────────

const mockRepo = () => ({
  find:                jest.fn(),
  findOne:             jest.fn(),
  create:              jest.fn(),
  save:                jest.fn(),
  update:              jest.fn(),
  createQueryBuilder:  jest.fn(),
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id:                    'pay-uuid',
    leaseId:               'lease-uuid',
    lease:                 null as any,
    dueDate:               new Date('2024-02-01') as any,
    amountDue:             1500,
    amountPaid:            0,
    paymentDate:           null as any,
    method:                null as any,
    lateFee:               0,
    status:                PaymentStatus.PENDING,
    stripePaymentIntentId: null as any,
    receiptNumber:         null as any,
    notes:                 null as any,
    createdAt:             new Date(),
    ...overrides,
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('PaymentsService', () => {
  let service: PaymentsService;
  let repo:    ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useFactory: mockRepo },
        {
          provide:  ConfigService,
          useValue: { get: jest.fn().mockReturnValue('sk_test_placeholder') },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    repo    = module.get(getRepositoryToken(Payment));
  });

  afterEach(() => jest.clearAllMocks());

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the payment when found', async () => {
      const payment = makePayment();
      repo.findOne.mockResolvedValue(payment);
      const result = await service.findOne('pay-uuid');
      expect(result).toEqual(payment);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── recordPayment ─────────────────────────────────────────────────────────

  describe('recordPayment', () => {
    it('marks payment as PAID when full amount is covered', async () => {
      const payment = makePayment({ amountDue: 1500, amountPaid: 0, lateFee: 0 });
      const updated = makePayment({ amountPaid: 1500, status: PaymentStatus.PAID });
      repo.findOne
        .mockResolvedValueOnce(payment) // initial fetch
        .mockResolvedValueOnce(updated); // re-fetch after update
      repo.update.mockResolvedValue(undefined);

      const result = await service.recordPayment('pay-uuid', {
        amountPaid: 1500,
        method:     PaymentMethod.CASH,
      });
      expect(repo.update).toHaveBeenCalledWith(
        'pay-uuid',
        expect.objectContaining({ status: PaymentStatus.PAID, amountPaid: 1500 }),
      );
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('marks payment as PARTIAL when less than due amount is paid', async () => {
      const payment = makePayment({ amountDue: 1500, amountPaid: 0, lateFee: 0 });
      const updated = makePayment({ amountPaid: 500, status: PaymentStatus.PARTIAL });
      repo.findOne
        .mockResolvedValueOnce(payment)
        .mockResolvedValueOnce(updated);
      repo.update.mockResolvedValue(undefined);

      const result = await service.recordPayment('pay-uuid', {
        amountPaid: 500,
        method:     PaymentMethod.BANK_TRANSFER,
      });
      expect(repo.update).toHaveBeenCalledWith(
        'pay-uuid',
        expect.objectContaining({ status: PaymentStatus.PARTIAL }),
      );
      expect(result.status).toBe(PaymentStatus.PARTIAL);
    });

    it('accumulates previously paid amount', async () => {
      // Existing: 500 paid of 1500 due
      const payment = makePayment({ amountDue: 1500, amountPaid: 500, lateFee: 0 });
      const updated = makePayment({ amountPaid: 1500, status: PaymentStatus.PAID });
      repo.findOne
        .mockResolvedValueOnce(payment)
        .mockResolvedValueOnce(updated);
      repo.update.mockResolvedValue(undefined);

      await service.recordPayment('pay-uuid', { amountPaid: 1000, method: PaymentMethod.CASH });
      expect(repo.update).toHaveBeenCalledWith(
        'pay-uuid',
        expect.objectContaining({ amountPaid: 1500, status: PaymentStatus.PAID }),
      );
    });

    it('factors in late fee when determining PAID vs PARTIAL', async () => {
      const payment = makePayment({ amountDue: 1500, amountPaid: 0, lateFee: 100 });
      const updated = makePayment({ amountPaid: 1500, status: PaymentStatus.PARTIAL });
      repo.findOne
        .mockResolvedValueOnce(payment)
        .mockResolvedValueOnce(updated);
      repo.update.mockResolvedValue(undefined);

      // Paying only the base amount (1500) but owe 1600 total → PARTIAL
      await service.recordPayment('pay-uuid', { amountPaid: 1500, method: PaymentMethod.CASH });
      expect(repo.update).toHaveBeenCalledWith(
        'pay-uuid',
        expect.objectContaining({ status: PaymentStatus.PARTIAL }),
      );
    });
  });

  // ── markOverdue ───────────────────────────────────────────────────────────

  describe('markOverdue', () => {
    it('returns the count of payments updated to OVERDUE', async () => {
      const mockQb = {
        update:   jest.fn().mockReturnThis(),
        set:      jest.fn().mockReturnThis(),
        where:    jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute:  jest.fn().mockResolvedValue({ affected: 5 }),
      };
      repo.createQueryBuilder.mockReturnValue(mockQb);

      const count = await service.markOverdue();
      expect(count).toBe(5);
      expect(mockQb.execute).toHaveBeenCalled();
    });

    it('returns 0 when no payments are affected', async () => {
      const mockQb = {
        update:   jest.fn().mockReturnThis(),
        set:      jest.fn().mockReturnThis(),
        where:    jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute:  jest.fn().mockResolvedValue({ affected: 0 }),
      };
      repo.createQueryBuilder.mockReturnValue(mockQb);

      const count = await service.markOverdue();
      expect(count).toBe(0);
    });
  });
});
