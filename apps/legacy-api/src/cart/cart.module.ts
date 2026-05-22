import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartCronService } from './cron/cart.cron';
import { CartController } from './cart.controller';
import { NotificationModule } from '../notification/notification.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from './entities/cart.entity';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../business/schema/business.schema';
import { Employee, EmployeeSchema } from '../employee/entities/employee.entity';
import { Product, ProductSchema } from '../product/entities/product.entity';
import { Branch, BranchSchema } from '../branch/entities/branch.entity';
import { ShoppingListController } from './shopping-list.controller';
import { ShoppingListService } from './shopping-list.service';
import {
  ShoppingList,
  ShoppingListSchema,
} from './entities/shopping-list.entity';
import { CartNotificationProcessor } from './processors/cart-notification.processor';
import { JobsModule } from '../jobs/jobs.module';
import { RedisLockService } from '../utils/redis-lock.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Product.name, schema: ProductSchema },
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: ShoppingList.name, schema: ShoppingListSchema },
    ]),
    NotificationModule,
    JobsModule,
  ],
  controllers: [CartController, ShoppingListController],
  providers: [
    CartService,
    ShoppingListService,
    CartCronService,
    CartNotificationProcessor,
    RedisLockService,
  ],
})
export class CartModule {}
