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
import { AdminReviewController } from './admin-review.controller';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { Review, ReviewSchema } from './schema/review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      // Required by ActiveAdminGuard (via @AdminAuth) on the admin controller.
      { name: AdminUser.name, schema: AdminUserSchema },
      // For resolving the submitter's business name on create.
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
    ]),
  ],
  controllers: [ReviewController, AdminReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
