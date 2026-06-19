import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchaseorder.service';
import { PurchaseOrderController } from './purchaseorder.controller';
import { EmailService } from '../../notification/email/email.service';
import {
  PurchaseOrderCart,
  PurchaseOrderCartSchema,
} from './entities/cart.entity';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from './entities/purchaseorder.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../../product/entities/product.entity';
import {
  Category,
  CategorySchema,
} from '../../category/entities/category.entity';
import {
  ActivityLog,
  ActivityLogSchema,
} from '../../activity/schema/activityLog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseOrderCart.name, schema: PurchaseOrderCartSchema },
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
  ],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService, EmailService],
})
export class PurchaseorderModule {}
