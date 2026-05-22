import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../../product/entities/product.entity';
import {
  Category,
  CategorySchema,
} from '../../category/entities/category.entity';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { Unit, UnitSchema } from '../../product/entities/units.entity';
import {
  ActivityLog,
  ActivityLogSchema,
} from '../../activity/schema/activityLog.schema';
import { Order, OrderSchema } from '../../order/entities/order.entity';
import {
  InventoryMovement,
  InventoryMovementSchema,
} from '../../product/entities/inventoryMovement.entity';
import { StockCount, StockCountSchema } from './schema/stockCount';
import { ProductListener } from './listeners/product.listener';
import { AdminUser, AdminUserSchema } from '../auth/schema/adminUser.schema';
import { EmailService } from '../../notification/email/email.service';
import { RedisLockService } from '../../utils/redis-lock.service';
import { ProductCronService } from './cron/product.cron.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Order.name, schema: OrderSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: InventoryMovement.name, schema: InventoryMovementSchema },
      { name: StockCount.name, schema: StockCountSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
    ]),
  ],
  providers: [
    ProductService,
    CloudinaryService,
    ProductListener,
    ProductCronService,
    EmailService,
    RedisLockService,
  ],
  controllers: [ProductController],
})
export class AdminProductModule {}
