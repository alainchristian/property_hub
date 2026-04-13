import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentStatus, PaymentMethod } from './payment.entity';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY') || 'sk_test_placeholder', {
      apiVersion: '2023-10-16' as any,
    });
  }

  findAll(): Promise<Payment[]> {
    return this.repo.find({ relations: ['lease'], order: { dueDate: 'DESC' } });
  }

  findByLease(leaseId: string): Promise<Payment[]> {
    return this.repo.find({ where: { leaseId }, order: { dueDate: 'ASC' } });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.repo.findOne({ where: { id }, relations: ['lease'] });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async create(dto: CreatePaymentDto): Promise<Payment> {
    const payment = this.repo.create(dto);
    return this.repo.save(payment);
  }

  async recordPayment(id: string, dto: RecordPaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    const paid = Number(payment.amountPaid) + Number(dto.amountPaid);
    const due = Number(payment.amountDue) + Number(payment.lateFee);

    const status = paid >= due ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

    await this.repo.update(id, {
      amountPaid: paid,
      paymentDate: new Date(),
      method: dto.method,
      receiptNumber: dto.receiptNumber,
      status,
      notes: dto.notes,
    });

    return this.findOne(id);
  }

  async createStripeCheckout(paymentId: string, tenantEmail: string) {
    const payment = await this.findOne(paymentId);
    const totalCents = Math.round(
      (Number(payment.amountDue) + Number(payment.lateFee) - Number(payment.amountPaid)) * 100,
    );

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: tenantEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: totalCents,
          product_data: { name: `Rent Payment - Due ${payment.dueDate}` },
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${this.config.get('FRONTEND_URL')}/portal/payments?success=true`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/portal/payments?cancelled=true`,
      metadata: { paymentId },
    });

    return { url: session.url };
  }

  async handleStripeWebhook(payload: Buffer, sig: string) {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    const event = this.stripe.webhooks.constructEvent(payload, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      if (paymentId) {
        await this.recordPayment(paymentId, {
          amountPaid: (session.amount_total || 0) / 100,
          method: PaymentMethod.ONLINE,
          receiptNumber: session.payment_intent as string,
        });
      }
    }
  }

  async markOverdue(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(Payment)
      .set({ status: PaymentStatus.OVERDUE })
      .where('status = :status', { status: PaymentStatus.PENDING })
      .andWhere('due_date < NOW()')
      .execute();
    return result.affected || 0;
  }
}
