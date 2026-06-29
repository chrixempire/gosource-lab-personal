import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as dotenv from 'dotenv';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessModule } from './business/business.module';
import { AuthModule } from './auth/auth.module';
import { AuthValidationMiddleware } from './auth/middleware/validation.middleware';
import { BranchModule } from './branch/branch.module';
import { NotificationModule } from './notification/notification.module';
import { EmployeeModule } from './employee/employee.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { AdminAuthModule } from './admin/auth/auth.module';
import { AdminProductModule } from './admin/product/product.module';
import { CartModule } from './cart/cart.module';
import { InvoiceModule } from './admin/invoice/invoice.module';
import { PaystackModule } from './paystack/paystack.module';
import { ExternalService } from './external/external.service';
import { HttpModule } from '@nestjs/axios';
import { AdminCategoryModule } from './admin/category/category.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RequestModule } from './request/request.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AdminOrderModule } from './admin/order/order.module';
import { CustomerModule } from './admin/customer/customer.module';
import { AdminModule } from './admin/admin/admin.module';
import { CouponModule } from './admin/coupon/coupon.module';
import { WalletModule } from './wallet/wallet.module';
import { AccountingModule } from './accounting/accounting.module';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisClientOptions } from 'redis';
import { PurchaseorderModule } from './admin/purchaseorder/purchaseorder.module';
import { CreditModule } from './credit/credit.module';
import * as redisStore from 'cache-manager-redis-store';
import { AdminCreditModule } from './admin/credit/credit.module';
import { ItemModule } from './admin/item/item.module';
import { ActivityModule } from './activity/activity.module';
import { RoleModule } from './admin/role/role.module';
import { RequestLoggerMiddleware } from './request-logger/middleware/request-logger.middleware';
import { RequestLoggerModule } from './request-logger/request-logger.module';
import { AdminPromotionModule } from './admin/promotion/promotion.module';
import { PromotionModule } from './promotion/promotion.module';
import { MarketplaceBannerModule } from './marketplace-banner/marketplace-banner.module';
import { AdminMarketplaceBannerModule } from './admin/marketplace-banner/marketplace-banner.module';
import { SecurityMiddleware } from './middleware/security.middleware';
import { JobsModule } from './jobs/jobs.module';
import { AdminMessagingModule } from './admin/messaging/messaging.module';

dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DB_URL, {
      sanitizeFilter: true,
    }),
    JobsModule,
    BusinessModule,
    AuthModule,
    BranchModule,
    EmployeeModule,
    CategoryModule,
    ProductModule,
    OrderModule,
    AdminAuthModule,
    AdminProductModule,
    CartModule,
    InvoiceModule,
    PaystackModule,
    HttpModule,
    AdminCategoryModule,
    AdminOrderModule,
    AnalyticsModule,
    RequestModule,
    FeedbackModule,
    ActivityModule,
    CustomerModule,
    NotificationModule,

    AdminModule,
    CouponModule,
    WalletModule,
    AccountingModule,
    AdminCreditModule,
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore,
        url: process.env.REDIS_URL,
      }),
    }),
    PurchaseorderModule,
    CreditModule,
    ItemModule,
    RoleModule,
    RequestLoggerModule,
    AdminPromotionModule,
    PromotionModule,
    MarketplaceBannerModule,
    AdminMarketplaceBannerModule,
    AdminMessagingModule,
  ],
  controllers: [AppController],
  providers: [AppService, ExternalService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .exclude('/v2/paystack/webhook')
      .forRoutes('*');
    consumer
      .apply(RequestLoggerMiddleware)
      .exclude(
        '/v2/health',
        '/v2/paystack/webhook',
        '/v2',
        '/v2/request-logs',
        '/v2/request-logs/statistics',
      )
      .forRoutes('*');
    consumer
      .apply(AuthValidationMiddleware)
      .forRoutes(
        { path: '/v2/auth/login', method: RequestMethod.POST },
        { path: '/v2/auth/resend-otp', method: RequestMethod.POST },
        { path: '/v2/auth/verify-otp', method: RequestMethod.POST },
        { path: '/v2/auth/setup-account', method: RequestMethod.PATCH },
      );
  }
}
