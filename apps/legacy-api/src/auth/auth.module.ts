import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Otp, OtpSchema } from './schema/otp.schema';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../business/schema/business.schema';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from '../notification/email/email.service';
import { Employee, EmployeeSchema } from '../employee/entities/employee.entity';
import { Branch, BranchSchema } from '../branch/entities/branch.entity';
import { SlackService } from '../slack/slack.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      // signOptions: { expiresIn: '1h' },
    }),
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
  ],
  providers: [AuthService, EmailService, SlackService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
