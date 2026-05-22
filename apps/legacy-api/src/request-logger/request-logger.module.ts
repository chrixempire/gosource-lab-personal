import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestLoggerController } from './request-logger.controller';
import { RequestLoggerService } from './request-logger.service';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { RequestLog, RequestLogSchema } from './schema/request-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequestLog.name, schema: RequestLogSchema },
    ]),
  ],
  controllers: [RequestLoggerController],
  providers: [RequestLoggerService, RequestLoggerMiddleware],
  exports: [RequestLoggerService, RequestLoggerMiddleware],
})
export class RequestLoggerModule {}
