import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminUser,
  AdminUserSchema,
} from '../admin/auth/schema/adminUser.schema';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../business/schema/business.schema';
import { AdminFeedbackController } from './admin-feedback.controller';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { Feedback, FeedbackSchema } from './schema/feedback.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
      // Required by ActiveAdminGuard (via @AdminAuth) on the admin controller.
      { name: AdminUser.name, schema: AdminUserSchema },
      // For resolving the submitter's business name on create.
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
    ]),
  ],
  controllers: [FeedbackController, AdminFeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
