import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Promotion } from '../../promotion/schemas/promotion.schema';
import { PromotionService } from './promotion.service';
import { RedisLockService } from '../../utils/redis-lock.service';

@Injectable()
export class PromotionCronService {
  private readonly logger = new Logger(PromotionCronService.name);

  constructor(
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<Promotion>,
    private readonly promotionService: PromotionService,
    private redisLock: RedisLockService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'promotion-lifecycle-check',
  })
  async handlePromotionLifecycle() {
    const lockKey = 'promotion-lifecycle-lock';
    let hasLock = false;

    try {
      hasLock = await this.redisLock.acquireLock(lockKey);

      if (!hasLock) {
        return; // Another instance is handling this
      }

      this.logger.debug('Running promotion lifecycle check...');
      const now = new Date();

      // 1. Activate pending promotions
      // Criteria: isActive is false, startDate <= now, endDate > now
      const promotionsToActivate = await this.promotionModel.find({
        isActive: false,
        startDate: { $lte: now },
        endDate: { $gt: now },
        isDeactivatedManually: { $ne: true },
      });

      if (promotionsToActivate.length > 0) {
        this.logger.log(
          `Found ${promotionsToActivate.length} promotions to activate.`,
        );
        for (const promotion of promotionsToActivate) {
          try {
            // Set active first to ensure logic passes
            promotion.isActive = true;
            await promotion.save();

            // Apply discounts (Updates Product Model)
            await this.promotionService.applyDiscounts(promotion);
            this.logger.log(`Activated promotion: ${promotion.name}`);
          } catch (error) {
            this.logger.error(
              `Failed to activate promotion ${promotion._id}`,
              error,
            );
          }
        }
      }

      // 2. Deactivate expired promotions
      // Criteria: isActive is true, endDate < now
      const promotionsToDeactivate = await this.promotionModel.find({
        isActive: true,
        endDate: { $lt: now },
      });

      if (promotionsToDeactivate.length > 0) {
        this.logger.log(
          `Found ${promotionsToDeactivate.length} promotions to deactivate.`,
        );
        for (const promotion of promotionsToDeactivate) {
          try {
            // Revert discounts (Updates Product Model)
            // We call revert BEFORE setting inactive technically, but revert check handles it.
            // Actually, revertDiscounts just needs product list.
            await this.promotionService.revertDiscounts(promotion);

            promotion.isActive = false;
            await promotion.save();
            this.logger.log(`Deactivated promotion: ${promotion.name}`);
          } catch (error) {
            this.logger.error(
              `Failed to deactivate promotion ${promotion._id}`,
              error,
            );
          }
        }
      }
    } catch (error: any) {
      this.logger.error('Failed to handle promotion lifecycle:', error);
    } finally {
      // Release the lock if it was acquired
      if (hasLock) {
        await this.redisLock.releaseLock(lockKey);
      }
    }
  }
}
