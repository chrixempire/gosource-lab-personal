import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FirebaseService } from './firebase/firebase.service';
import { NotificationController } from './notification.controller';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../business/schema/business.schema';
import { Employee, EmployeeSchema } from '../employee/entities/employee.entity';
import { EmailService } from './email/email.service';
import { NotificationService } from './notification.service';
import {
  Notification,
  NotificationSchema,
} from './schema/notification.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [FirebaseService, EmailService, NotificationService],
  exports: [FirebaseService, EmailService, NotificationService],
})
export class NotificationModule {}
