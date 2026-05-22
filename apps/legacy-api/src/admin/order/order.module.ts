import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderListener } from './listeners/order.listener';
import { OrderController } from './order.controller';
import { Order, OrderSchema } from '../../order/entities/order.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from '../../notification/email/email.service';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../../business/schema/business.schema';
import { Timeline, TimelineSchema } from '../../order/entities/timeline.entity';
import { Product, ProductSchema } from '../../product/entities/product.entity';
import {
  OrderActivityLog,
  OrderActivityLogSchema,
} from '../../order/entities/activity.entity';
import {
  ActivityLog,
  ActivityLogSchema,
} from '../../activity/schema/activityLog.schema';
import {
  InventoryMovement,
  InventoryMovementSchema,
} from '../../product/entities/inventoryMovement.entity';
import { Request, RequestSchema } from '../../request/schema/request.schema';
import { RequestModule } from '../../request/request.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationModule } from '../../notification/notification.module';
import {
  Employee,
  EmployeeSchema,
} from '../../employee/entities/employee.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: Timeline.name, schema: TimelineSchema },
      { name: Product.name, schema: ProductSchema },
      { name: OrderActivityLog.name, schema: OrderActivityLogSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: InventoryMovement.name, schema: InventoryMovementSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Request.name, schema: RequestSchema },
    ]),
    RequestModule,
    EventEmitterModule.forRoot(),
    NotificationModule,
  ],
  providers: [OrderService, EmailService, OrderListener],
  controllers: [OrderController],
})
export class AdminOrderModule {}
