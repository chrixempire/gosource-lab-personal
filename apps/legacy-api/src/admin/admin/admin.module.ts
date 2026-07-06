import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUser, AdminUserSchema } from '../auth/schema/adminUser.schema';
import { AdminRole, AdminRoleSchema } from '../auth/schema/adminRole.schema';
import {
  AdminUserRole,
  AdminUserRoleSchema,
} from '../auth/schema/adminUserRole.schema';
import { Product, ProductSchema } from '../../product/entities/product.entity';
import { Order, OrderSchema } from '../../order/entities/order.entity';
import { Request, RequestSchema } from '../../request/schema/request.schema';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../../business/schema/business.schema';
import { Branch, BranchSchema } from '../../branch/entities/branch.entity';
import {
  Employee,
  EmployeeSchema,
} from '../../employee/entities/employee.entity';
import {
  Category,
  CategorySchema,
} from '../../category/entities/category.entity';
import { Role, RoleSchema } from '../role/entities/role.entity';
import {
  SystemConfig,
  SystemConfigSchema,
} from './schema/systemConfig.schema';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';
import { ActivityModule } from '../../activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AdminUserRole.name, schema: AdminUserRoleSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Request.name, schema: RequestSchema },
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Category.name, schema: CategorySchema },
      { name: SystemConfig.name, schema: SystemConfigSchema },
    ]),
    ActivityModule,
  ],
  providers: [AdminService, SystemConfigService],
  controllers: [AdminController, SystemConfigController],
  exports: [SystemConfigService],
})
export class AdminModule {}
