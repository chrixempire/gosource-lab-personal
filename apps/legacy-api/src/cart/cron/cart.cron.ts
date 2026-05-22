import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from '../entities/cart.entity';
import { subDays, isBefore, differenceInDays, getDay } from 'date-fns';
import { JOB_NAMES, QUEUE_NAMES } from '../../jobs/constants';
import { RedisLockService } from '../../utils/redis-lock.service';

@Injectable()
export class CartCronService {
  private readonly logger = new Logger(CartCronService.name);
  private readonly BATCH_SIZE = 20; // Process 20 businesses concurrently

  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectQueue(QUEUE_NAMES.CART_ABANDONMENT) private notificationQueue: Queue,
    private readonly redisLock: RedisLockService,
  ) {}

  @Cron('0 9 * * 1-5')
  async checkAbandonedCarts() {
    const lockKey = 'abandoned_cart_check_lock';

    await this.redisLock.withLock(lockKey, 3600, async () => {
      const today = new Date();
      const dayOfWeek = getDay(today);

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        this.logger.log('Weekend detected, skipping abandoned cart check');
        return;
      }

      this.logger.log('Starting abandoned cart check with job queue...');

      try {
        const businesses = await this.getBusinessesWithPendingCarts();

        this.logger.log(
          `Found ${businesses.length} businesses with pending carts`,
        );

        // Process businesses in batches
        for (let i = 0; i < businesses.length; i += this.BATCH_SIZE) {
          const businessBatch = businesses.slice(i, i + this.BATCH_SIZE);

          // Process each business and create jobs
          const jobPromises = businessBatch.map((businessId) =>
            this.processBusinessAndQueueJobs(businessId.toString()),
          );

          await Promise.allSettled(jobPromises);

          this.logger.log(
            `Queued jobs for batch ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(businesses.length / this.BATCH_SIZE)}`,
          );
        }

        // Get queue stats for monitoring
        const queueStats = await this.notificationQueue.getJobCounts();
        this.logger.log('Queue statistics:', queueStats);
      } catch (error: any) {
        this.logger.error('Failed to process abandoned carts', error.stack);
      }
    });
  }

  private async getBusinessesWithPendingCarts(): Promise<Types.ObjectId[]> {
    const threeDaysAgo = subDays(new Date(), 3);

    const result = await this.cartModel.aggregate([
      {
        $match: {
          createdAt: { $lt: threeDaysAgo },
        },
      },
      {
        $group: {
          _id: '$business',
        },
      },
    ]);

    return result.map((r) => r._id);
  }

  private async processBusinessAndQueueJobs(businessId: string): Promise<void> {
    try {
      const threeDaysAgo = subDays(new Date(), 3);

      // Get carts grouped for this business
      const carts = await this.getGroupedCartsForBusiness(
        businessId,
        threeDaysAgo,
      );

      if (carts.length === 0) {
        return;
      }

      // Group carts by notification stage
      const cartsByStage = carts.reduce<Record<number, Cart[]>>((acc, cart) => {
        const stage = cart.notificationCount + 1;

        if (stage <= 2) {
          (acc[stage] ??= []).push(cart);
        }

        return acc;
      }, {});

      // Queue jobs for each stage
      await Promise.all(
        Object.entries(cartsByStage).map(([stage, stageCarts]) =>
          this.notificationQueue.add(
            JOB_NAMES.SEND_CART_NOTIFICATION,
            {
              businessId,
              carts: stageCarts,
              notificationStage: Number(stage),
            },
            {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 60000,
              },
              removeOnComplete: 100,
              removeOnFail: 50,
            },
          ),
        ),
      );

      this.logger.debug(
        `Queued ${Object.values(cartsByStage).flat().length} jobs for business ${businessId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to process business ${businessId}`,
        error.stack,
      );
    }
  }

  private async getGroupedCartsForBusiness(
    businessId: string,
    threeDaysAgo: Date,
  ): Promise<any[]> {
    const carts = await this.cartModel.aggregate([
      {
        $match: {
          business: new Types.ObjectId(businessId),
        },
      },
      {
        $sort: { createdAt: 1 },
      },
      {
        $group: {
          _id: {
            branch: '$branch',
          },
          itemIds: { $push: '$_id' },
          oldestItemDate: { $min: '$createdAt' },
          newestItemDate: { $max: '$createdAt' },
          lastNotificationSentAt: { $max: '$lastAbandonedNotificationSentAt' },
          notificationCount: { $max: '$abandonedNotificationCount' },
          itemCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id.branch',
          foreignField: '_id',
          as: 'branchInfo',
        },
      },
      {
        $addFields: {
          branchName: { $arrayElemAt: ['$branchInfo.branchName', 0] },
          branchId: '$_id.branch',
          businessId: new Types.ObjectId(businessId),
        },
      },
      {
        $match: {
          newestItemDate: { $lt: threeDaysAgo },
        },
      },
    ]);

    // Calculate cart age and filter based on notification criteria
    const now = new Date();
    const fiveDaysAgo = subDays(now, 5);

    return carts.filter((cart) => {
      const cartAge = differenceInDays(now, new Date(cart.oldestItemDate));

      switch (cart.notificationCount || 0) {
        case 0:
          return cartAge >= 3;
        case 1:
          return (
            cartAge >= 5 &&
            cart.lastNotificationSentAt &&
            isBefore(new Date(cart.lastNotificationSentAt), fiveDaysAgo)
          );
        default:
          return false;
      }
    });
  }
}
