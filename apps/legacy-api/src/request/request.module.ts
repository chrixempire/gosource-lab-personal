import { Module } from '@nestjs/common';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from '../cart/entities/cart.entity';
import { Branch, BranchSchema } from '../branch/entities/branch.entity';
import { Request, RequestSchema } from './schema/request.schema';
import { Order, OrderSchema } from '../order/entities/order.entity';
import { EmailService } from '../notification/email/email.service';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../business/schema/business.schema';
import { Product, ProductSchema } from '../product/entities/product.entity';
import { Employee, EmployeeSchema } from '../employee/entities/employee.entity';
import { Coupon, CouponSchema } from '../admin/coupon/schema/coupon.schema';
import { Wallet, WalletSchema } from '../wallet/schema/wallet.schema';
import { WalletService } from '../wallet/wallet.service';
import { Otp, OtpSchema } from '../auth/schema/otp.schema';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from '../wallet/schema/walletTransaction.schema';
import {
  PaymentTransactionReference,
  PaymentTransactionReferenceSchema,
} from '../wallet/schema/transactionReferenc.schema';
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
import { Timeline, TimelineSchema } from '../order/entities/timeline.entity';
import {
  ActivityLog,
  ActivityLogSchema,
} from '../activity/schema/activityLog.schema';
import {
  OrderActivityLog,
  OrderActivityLogSchema,
} from '../order/entities/activity.entity';
import { AccountingModule } from '../accounting/accounting.module';
import {
  InventoryMovement,
  InventoryMovementSchema,
} from '../product/entities/inventoryMovement.entity';
import { CreditRepaymentsModule } from '../credit-repayment/credit-repayment.module';
import {
  ShoppingList,
  ShoppingListSchema,
} from '../cart/entities/shopping-list.entity';
import { CreditModule } from '../credit/credit.module';
import { AdminModule } from '../admin/admin/admin.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Request.name, schema: RequestSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      {
        name: PaymentTransactionReference.name,
        schema: PaymentTransactionReferenceSchema,
      },
      { name: Webhook.name, schema: WebhookSchema },
      { name: PaymentReference.name, schema: PaymentReferenceSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Timeline.name, schema: TimelineSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: OrderActivityLog.name, schema: OrderActivityLogSchema },
      { name: InventoryMovement.name, schema: InventoryMovementSchema },
      { name: ShoppingList.name, schema: ShoppingListSchema },
    ]),
    HttpModule,
    AccountingModule,
    CreditRepaymentsModule,
    CreditModule,
    AdminModule,
  ],
  providers: [
    RequestService,
    EmailService,
    WalletService,
    TermiiService,
    IdentitypassService,
    PaystackService,
    ExternalService,
    InvoiceService,
    OrderService,
  ],
  controllers: [RequestController],
  exports: [RequestService],
})
export class RequestModule {}
