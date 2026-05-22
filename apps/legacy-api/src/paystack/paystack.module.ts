import { Module, forwardRef } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { PaystackController } from './paystack.controller';
import { ExternalService } from '../external/external.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Webhook, WebhookSchema } from './schema/webhook.schema';
import {
  PaymentReference,
  PaymentReferenceSchema,
} from './schema/paymentReference.schema';
import { InvoiceService } from '../admin/invoice/invoice.service';
import { Invoice, InvoiceSchema } from '../admin/invoice/schema/invoice.schema';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../business/schema/business.schema';
import { Order, OrderSchema } from '../order/entities/order.entity';
import { Product, ProductSchema } from '../product/entities/product.entity';
import { EmailService } from '../notification/email/email.service';
import { OrderService } from '../order/order.service';
import { Timeline, TimelineSchema } from '../order/entities/timeline.entity';
import { Request, RequestSchema } from '../request/schema/request.schema';
import { WalletService } from '../wallet/wallet.service';
import { Wallet, WalletSchema } from '../wallet/schema/wallet.schema';
import { Otp, OtpSchema } from '../auth/schema/otp.schema';
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
import {
  WalletTransaction,
  WalletTransactionSchema,
} from '../wallet/schema/walletTransaction.schema';
import {
  PaymentTransactionReference,
  PaymentTransactionReferenceSchema,
} from '../wallet/schema/transactionReferenc.schema';
import { AccountingService } from '../accounting/accounting.service';
import { TermiiService } from '../termii/termii.service';
import { IdentitypassService } from '../identitypass/identitypass.service';
import {
  OrderActivityLog,
  OrderActivityLogSchema,
} from '../order/entities/activity.entity';
import { CreditRepaymentsModule } from '../credit-repayment/credit-repayment.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Webhook.name, schema: WebhookSchema },
      { name: PaymentReference.name, schema: PaymentReferenceSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Request.name, schema: RequestSchema },
      { name: Timeline.name, schema: TimelineSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Otp.name, schema: OtpSchema },
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
      { name: OrderActivityLog.name, schema: OrderActivityLogSchema },
    ]),
    HttpModule,
    forwardRef(() => CreditRepaymentsModule),
  ],
  providers: [
    PaystackService,
    ExternalService,
    InvoiceService,
    EmailService,
    OrderService,
    WalletService,
    AccountingService,
    TermiiService,
    IdentitypassService,
  ],
  controllers: [PaystackController],
  exports: [PaystackService],
})
export class PaystackModule {}
