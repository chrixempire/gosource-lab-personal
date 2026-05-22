import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PaymentReference,
  PaymentReferenceSchema,
} from '../paystack/schema/paymentReference.schema';
import {
  CreditPaymentReference,
  CreditPaymentReferenceSchema,
} from '../credit/schema/creditPaymentReference.schema';
import { WalletModule } from '../wallet/wallet.module';
import {
  CreditAccount,
  CreditAccountSchema,
} from '../credit/schema/creditAccount.schema';
import {
  CreditRequest,
  CreditRequestSchema,
} from '../credit/schema/creditRequest';
import {
  RepaymentSchedule,
  RepaymentScheduleSchema,
} from '../credit/schema/repaymentSchedule.schema';
import { CreditRepaymentService } from './credit-repayment.service';
import { CreditRepaymentCronService } from './credit-repayment.cron';
import { PaystackModule } from '../paystack/paystack.module';
import { forwardRef } from '@nestjs/common';
import { CreditNotificationProcessor } from './processors/credit-notification.processor';
import { JobsModule } from '../jobs/jobs.module';
import { RedisLockService } from '../utils/redis-lock.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CreditAccount.name, schema: CreditAccountSchema },
      { name: CreditRequest.name, schema: CreditRequestSchema },
      { name: RepaymentSchedule.name, schema: RepaymentScheduleSchema },
      { name: PaymentReference.name, schema: PaymentReferenceSchema },
      {
        name: CreditPaymentReference.name,
        schema: CreditPaymentReferenceSchema,
      },
    ]),
    WalletModule,
    forwardRef(() => PaystackModule),
    JobsModule,
  ],
  providers: [
    CreditRepaymentService,
    CreditRepaymentCronService,
    CreditNotificationProcessor,
    RedisLockService,
  ],
  exports: [CreditRepaymentService],
})
export class CreditRepaymentsModule {}
