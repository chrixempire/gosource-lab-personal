import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Branch, BranchSchema } from './entities/branch.entity';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from 'src/business/schema/business.schema';
import { BusinessService } from 'src/business/business.service';
import { Employee, EmployeeSchema } from '../employee/entities/employee.entity';
import { Order, OrderSchema } from '../order/entities/order.entity';
import { Otp, OtpSchema } from '../auth/schema/otp.schema';
import { EmailService } from '../notification/email/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Branch.name, schema: BranchSchema },
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
  ],
  controllers: [BranchController],
  providers: [BranchService, BusinessService, EmailService],
})
export class BranchModule {}
