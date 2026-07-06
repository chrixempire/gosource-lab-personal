import { Module } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { PromotionController } from './promotion.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { PromotionCronService } from './promotion.cron';
import {
  Promotion,
  PromotionSchema,
} from '../../promotion/schemas/promotion.schema';
import { Product, ProductSchema } from '../../product/entities/product.entity';
import { Order, OrderSchema } from 'src/order/entities/order.entity';
import { RedisLockService } from '../../utils/redis-lock.service';
import { ActivityModule } from '../../activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Promotion.name, schema: PromotionSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    ScheduleModule.forRoot(),
    ActivityModule,
  ],
  controllers: [PromotionController],
  providers: [PromotionService, PromotionCronService, RedisLockService],
  exports: [PromotionService],
})
export class AdminPromotionModule {}
