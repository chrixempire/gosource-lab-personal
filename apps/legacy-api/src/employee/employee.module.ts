import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from './entities/employee.entity';
import { BusinessService } from '../business/business.service';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../business/schema/business.schema';
import { Otp, OtpSchema } from '../auth/schema/otp.schema';
import { EmailService } from '../notification/email/email.service';
import { JwtModule } from '@nestjs/jwt';
import {
  EmployeeInvite,
  EmployeeInviteSchema,
} from './entities/invites.entity';
import { Branch, BranchSchema } from '../branch/entities/branch.entity';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '5000h' },
    }),
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: EmployeeInvite.name, schema: EmployeeInviteSchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, BusinessService],
})
export class EmployeeModule {}
