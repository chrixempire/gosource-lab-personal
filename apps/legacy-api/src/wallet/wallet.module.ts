import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet, WalletSchema } from './schema/wallet.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Otp, OtpSchema } from '../auth/schema/otp.schema';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../business/schema/business.schema';
import {
  GeneralLedger,
  GeneralLedgerSchema,
} from '../accounting/schema/generalLedger.schema';
import {
  TransactionLedger,
  TransactionLedgerSchema,
} from '../accounting/schema/transactionLedger.schema';
import {
  FundingLedger,
  FundingLedgerSchema,
} from '../accounting/schema/fundingLedger.schema';
import {
  CreditLedger,
  CreditLedgerSchema,
} from '../accounting/schema/creditLedger.schema';
import {
  AdjustmentLedger,
  AdjustmentLedgerSchema,
} from '../accounting/schema/adjustmentLedger.schema';
import {
  UserWalletLedger,
  UserWalletLedgerSchema,
} from '../accounting/schema/userWalletLedger.schema';
import {
  LedgerAccount,
  LedgerAccountSchema,
} from '../accounting/schema/accountLedger.schema';
import {
  ExpenditureLedger,
  ExpenditureLedgerSchema,
} from '../accounting/schema/expenditureLedger.schema';
import { AccountingService } from '../accounting/accounting.service';
import { AccountingModule } from '../accounting/accounting.module';
import {
  PaymentTransactionReference,
  PaymentTransactionReferenceSchema,
} from './schema/transactionReferenc.schema';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from './schema/walletTransaction.schema';
import { TermiiService } from '../termii/termii.service';
import { HttpModule } from '@nestjs/axios';
import { IdentitypassService } from '../identitypass/identitypass.service';
import { PaystackService } from '../paystack/paystack.service';
import { ExternalService } from '../external/external.service';
import { Webhook, WebhookSchema } from '../paystack/schema/webhook.schema';
import {
  PaymentReference,
  PaymentReferenceSchema,
} from '../paystack/schema/paymentReference.schema';
import { InvoiceService } from '../admin/invoice/invoice.service';
import { OrderService } from '../order/order.service';
import { Invoice, InvoiceSchema } from '../admin/invoice/schema/invoice.schema';
import { Order, OrderSchema } from '../order/entities/order.entity';
import { Product, ProductSchema } from '../product/entities/product.entity';
import { Timeline, TimelineSchema } from '../order/entities/timeline.entity';
import { RequestSchema, Request } from '../request/schema/request.schema';
import {
  OrderActivityLog,
  OrderActivityLogSchema,
} from '../order/entities/activity.entity';
import { CreditRepaymentService } from '../credit-repayment/credit-repayment.service';
import {
  CreditAccount,
  CreditAccountSchema,
} from '../credit/schema/creditAccount.schema';
import {
  CreditPaymentReference,
  CreditPaymentReferenceSchema,
} from '../credit/schema/creditPaymentReference.schema';
import {
  CreditRequest,
  CreditRequestSchema,
} from '../credit/schema/creditRequest';
import {
  RepaymentSchedule,
  RepaymentScheduleSchema,
} from '../credit/schema/repaymentSchedule.schema';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: GeneralLedger.name, schema: GeneralLedgerSchema },
      { name: TransactionLedger.name, schema: TransactionLedgerSchema },
      { name: FundingLedger.name, schema: FundingLedgerSchema },
      { name: CreditLedger.name, schema: CreditLedgerSchema },
      { name: AdjustmentLedger.name, schema: AdjustmentLedgerSchema },
      { name: UserWalletLedger.name, schema: UserWalletLedgerSchema },
      { name: LedgerAccount.name, schema: LedgerAccountSchema },
      { name: ExpenditureLedger.name, schema: ExpenditureLedgerSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      {
        name: PaymentTransactionReference.name,
        schema: PaymentTransactionReferenceSchema,
      },
      { name: Webhook.name, schema: WebhookSchema },
      { name: PaymentReference.name, schema: PaymentReferenceSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Timeline.name, schema: TimelineSchema },
      { name: Request.name, schema: RequestSchema },
      { name: OrderActivityLog.name, schema: OrderActivityLogSchema },
      { name: CreditAccount.name, schema: CreditAccountSchema },
      { name: CreditRequest.name, schema: CreditRequestSchema },
      { name: RepaymentSchedule.name, schema: RepaymentScheduleSchema },
      { name: PaymentReference.name, schema: PaymentReferenceSchema },
      {
        name: CreditPaymentReference.name,
        schema: CreditPaymentReferenceSchema,
      },
    ]),
    AccountingModule,
    HttpModule,
    JobsModule,
  ],
  providers: [
    WalletService,
    AccountingService,
    TermiiService,
    IdentitypassService,
    PaystackService,
    ExternalService,
    InvoiceService,
    OrderService,
    CreditRepaymentService,
  ],
  controllers: [WalletController],
  exports: [WalletService, AccountingModule, MongooseModule],
})
export class WalletModule {}
