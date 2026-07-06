import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityLog, ActivityLogSchema } from './schema/activityLog.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminUser,
  AdminUserSchema,
} from '../admin/auth/schema/adminUser.schema';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../business/schema/business.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
    ]),
  ],
  providers: [ActivityService],
  controllers: [ActivityController],
  exports: [ActivityService],
})
export class ActivityModule {}
