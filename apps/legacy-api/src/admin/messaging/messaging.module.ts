import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BusinessCustomer,
  BusinessCustomerSchema,
} from '../../business/schema/business.schema';
import { JobsModule } from '../../jobs/jobs.module';
import { NotificationModule } from '../../notification/notification.module';
import { AdminMessagingController } from './messaging.controller';
import { AdminMessagingEmailProcessor } from './messaging-email.processor';
import { AdminMessagingService } from './messaging.service';
import { PublicMessagingController } from './public-messaging.controller';
import { AdminMessage, AdminMessageSchema } from './schema/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminMessage.name, schema: AdminMessageSchema },
      { name: BusinessCustomer.name, schema: BusinessCustomerSchema },
    ]),
    JobsModule,
    NotificationModule,
  ],
  controllers: [AdminMessagingController, PublicMessagingController],
  providers: [AdminMessagingService, AdminMessagingEmailProcessor],
  exports: [AdminMessagingService],
})
export class AdminMessagingModule {}
