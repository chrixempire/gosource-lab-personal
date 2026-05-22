import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from './schema/business.schema';
import { Otp, OtpSchema } from '../auth/schema/otp.schema';
import { Employee, EmployeeSchema } from '../employee/entities/employee.entity';
import { EmailService } from '../notification/email/email.service';
import { Branch, BranchSchema } from '../branch/entities/branch.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
  ],
  providers: [BusinessService],
  exports: [BusinessService],
  controllers: [BusinessController],
})
export class BusinessModule {}
