import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue('overdue-check') private readonly overdueQueue: Queue,
    @InjectQueue('rent-reminders') private readonly reminderQueue: Queue,
    @InjectQueue('lease-expiry') private readonly expiryQueue: Queue,
  ) {}

  @Cron('0 0 * * *') // Midnight every day
  async runOverdueCheck() {
    this.logger.log('Scheduling overdue-check job');
    await this.overdueQueue.add({});
  }

  @Cron('0 8 * * *') // 8 AM every day
  async runRentReminders() {
    this.logger.log('Scheduling rent-reminders job');
    await this.reminderQueue.add({});
  }

  @Cron('0 9 * * 1') // 9 AM every Monday
  async runLeaseExpiryCheck() {
    this.logger.log('Scheduling lease-expiry job');
    await this.expiryQueue.add({});
  }
}
