import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order, OrderSchema } from './entities/order.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Timeline, TimelineSchema } from './entities/timeline.entity';
import {
  PaymentReference,
  PaymentReferenceSchema,
} from '../paystack/schema/paymentReference.schema';
import { Request, RequestSchema } from '../request/schema/request.schema';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../business/schema/business.schema';
import {
  OrderActivityLog,
  OrderActivityLogSchema,
} from './entities/activity.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Timeline.name, schema: TimelineSchema },
      { name: PaymentReference.name, schema: PaymentReferenceSchema },
      { name: Request.name, schema: RequestSchema },
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: OrderActivityLog.name, schema: OrderActivityLogSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
