import { Module } from '@nestjs/common';
import { RateLimitGuard } from '../../common/rate-limit.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { RequestController } from './request.controller';
import { RequestRepository } from './request.repository';
import { RequestService } from './request.service';

@Module({
  controllers: [RequestController],
  providers: [RequestRepository, RequestService, SessionAuthGuard, RateLimitGuard],
})
export class RequestModule {}
