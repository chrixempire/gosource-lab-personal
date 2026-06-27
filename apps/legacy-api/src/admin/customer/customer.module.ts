import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../../business/schema/business.schema';
import { Order, OrderSchema } from '../../order/entities/order.entity';
import {
  Employee,
  EmployeeSchema,
} from '../../employee/entities/employee.entity';
import { Branch, BranchSchema } from '../../branch/entities/branch.entity';
import { BranchService } from '../../branch/branch.service';
import { EmployeeService } from '../../employee/employee.service';
import {
  EmployeeInvite,
  EmployeeInviteSchema,
} from '../../employee/entities/invites.entity';
import { WalletModule } from '../../wallet/wallet.module';
import { AuthModule } from '../../auth/auth.module';
import {
  CreditRequest,
  CreditRequestSchema,
} from '../../credit/schema/creditRequest';
import {
  CreditAccount,
  CreditAccountSchema,
} from '../../credit/schema/creditAccount.schema';
import { ActivityModule } from '../../activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: EmployeeInvite.name, schema: EmployeeInviteSchema },
      { name: CreditRequest.name, schema: CreditRequestSchema },
      { name: CreditAccount.name, schema: CreditAccountSchema },
    ]),
    WalletModule,
    AuthModule,
    ActivityModule,
  ],
  providers: [CustomerService, BranchService, EmployeeService],
  controllers: [CustomerController],
})
export class CustomerModule {}
