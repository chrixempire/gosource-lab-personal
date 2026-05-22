import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from './schema/coupon.schema';
import { RequestSchema, Request } from '../../request/schema/request.schema';
import { Order, OrderSchema } from '../../order/entities/order.entity';

@Module({
  providers: [CouponService],
  controllers: [CouponController],
  imports: [
    MongooseModule.forFeature([
      { name: Coupon.name, schema: CouponSchema },
      { name: Request.name, schema: RequestSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
})
export class CouponModule {}
