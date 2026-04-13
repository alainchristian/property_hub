import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface OverdueNoticeData {
  tenantName: string;
  amountDue: number;
  lateFee: number;
  dueDate: Date;
}

export interface RentReminderData {
  tenantName: string;
  amountDue: number;
  dueDate: Date;
  unitNumber: string;
  propertyName: string;
}

export interface LeaseExpiryData {
  tenantName: string;
  endDate: Date;
  unitNumber: string;
  propertyName: string;
  daysRemaining: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private fromAddress: string;

  constructor(private readonly config: ConfigService) {
    this.fromAddress = this.config.get('MAIL_FROM') || 'noreply@propertyhub.local';
    this.transporter = nodemailer.createTransport({
      host: this.config.get('MAIL_HOST') || 'localhost',
      port: parseInt(this.config.get('MAIL_PORT') || '1025', 10),
      secure: false,
      auth: this.config.get('MAIL_USER')
        ? {
            user: this.config.get('MAIL_USER'),
            pass: this.config.get('MAIL_PASS'),
          }
        : undefined,
    });
  }

  async sendOverdueNotice(to: string, data: OverdueNoticeData): Promise<void> {
    const subject = 'Overdue Rent Notice';
    const html = `
      <h2>Overdue Rent Payment</h2>
      <p>Dear ${data.tenantName},</p>
      <p>Your rent payment of <strong>$${Number(data.amountDue).toFixed(2)}</strong>
         was due on <strong>${new Date(data.dueDate).toLocaleDateString()}</strong>.</p>
      <p>A late fee of <strong>$${Number(data.lateFee).toFixed(2)}</strong> has been applied.</p>
      <p>Total outstanding: <strong>$${(Number(data.amountDue) + Number(data.lateFee)).toFixed(2)}</strong></p>
      <p>Please log in to your tenant portal to make your payment immediately.</p>
    `;
    await this.send(to, subject, html);
  }

  async sendRentReminder(to: string, data: RentReminderData): Promise<void> {
    const subject = 'Upcoming Rent Payment Reminder';
    const html = `
      <h2>Rent Payment Reminder</h2>
      <p>Dear ${data.tenantName},</p>
      <p>This is a reminder that your rent payment of
         <strong>$${Number(data.amountDue).toFixed(2)}</strong>
         for unit <strong>${data.unitNumber}</strong> at
         <strong>${data.propertyName}</strong>
         is due on <strong>${new Date(data.dueDate).toLocaleDateString()}</strong>.</p>
      <p>Please ensure timely payment to avoid late fees.</p>
    `;
    await this.send(to, subject, html);
  }

  async sendLeaseExpiryNotice(to: string, data: LeaseExpiryData): Promise<void> {
    const subject = `Lease Expiry Notice — ${data.daysRemaining} Days Remaining`;
    const html = `
      <h2>Lease Expiry Notice</h2>
      <p>Dear ${data.tenantName},</p>
      <p>Your lease for unit <strong>${data.unitNumber}</strong> at
         <strong>${data.propertyName}</strong>
         expires on <strong>${new Date(data.endDate).toLocaleDateString()}</strong>
         (${data.daysRemaining} days remaining).</p>
      <p>Please contact your property manager to discuss renewal options.</p>
    `;
    await this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.fromAddress, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
    }
  }
}
