import { ScheduleModule } from '@nestjs/schedule';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from './constants';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
      },
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.CART_ABANDONMENT,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
      {
        name: QUEUE_NAMES.CREDIT_REPAYMENT,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
    ),
  ],
  exports: [BullModule],
})
export class JobsModule {}
