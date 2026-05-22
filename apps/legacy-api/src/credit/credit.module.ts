import { Module } from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreditController } from './credit.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Credit, CreditSchema } from './schema/credit.schema';
import { CreditRequest, CreditRequestSchema } from './schema/creditRequest';
import { S3Service } from '../cloudinary/s3.service';
import {
  CreditAccount,
  CreditAccountSchema,
} from './schema/creditAccount.schema';
import { CreditRepaymentsModule } from '../credit-repayment/credit-repayment.module';
import {
  RepaymentSchedule,
  RepaymentScheduleSchema,
} from './schema/repaymentSchedule.schema';
import {
  CreditPaymentReference,
  CreditPaymentReferenceSchema,
} from './schema/creditPaymentReference.schema';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from 'src/wallet/schema/walletTransaction.schema';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../business/schema/business.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Credit.name, schema: CreditSchema },
      { name: CreditRequest.name, schema: CreditRequestSchema },
      { name: CreditAccount.name, schema: CreditAccountSchema },
      { name: RepaymentSchedule.name, schema: RepaymentScheduleSchema },
      {
        name: CreditPaymentReference.name,
        schema: CreditPaymentReferenceSchema,
      },
      {
        name: WalletTransaction.name,
        schema: WalletTransactionSchema,
      },
      {
        name: BusinessCustomer.name,
        schema: BusinessCustomerSchema,
      },
    ]),
    CreditRepaymentsModule,
  ],
  providers: [CreditService, S3Service],
  controllers: [CreditController],
  exports: [CreditService],
})
export class CreditModule {}
