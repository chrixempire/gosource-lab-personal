import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { CreditRepaymentService } from './credit-repayment.service';
import { RedisLockService } from '../utils/redis-lock.service';

@Injectable()
export class CreditRepaymentCronService {
  private readonly logger = new Logger(CreditRepaymentCronService.name);

  constructor(
    private readonly creditRepaymentService: CreditRepaymentService,
    private readonly redisLock: RedisLockService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyOverdueUpdate() {
    const lockKey = 'credit_daily_overdue_update_lock';
    await this.redisLock.withLock(lockKey, 3600, async () => {
      this.logger.debug('Running daily credit overdue status update...');
      try {
        await this.creditRepaymentService.updateAllOverdueStatuses();
        this.logger.log('Successfully updated all credit overdue statuses.');
      } catch (error) {
        this.logger.error('Failed to update credit overdue statuses:', error);
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleUpcomingReminders() {
    const lockKey = 'credit_upcoming_reminders_lock';
    await this.redisLock.withLock(lockKey, 3600, async () => {
      this.logger.debug('Running daily upcoming credit repayment reminders...');
      try {
        await this.creditRepaymentService.sendUpcomingReminders();
        this.logger.log('Successfully sent all upcoming credit reminders.');
      } catch (error) {
        this.logger.error('Failed to send upcoming credit reminders:', error);
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handleOverdueNotices() {
    const lockKey = 'credit_overdue_notices_lock';
    await this.redisLock.withLock(lockKey, 3600, async () => {
      this.logger.debug('Running daily overdue credit notices...');
      try {
        await this.creditRepaymentService.sendOverdueNotices();
        this.logger.log('Successfully sent all overdue credit notices.');
      } catch (error) {
        this.logger.error('Failed to send overdue credit notices:', error);
      }
    });
  }
}
