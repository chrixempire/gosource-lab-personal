import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './session-auth.guard';
import { RateLimitGuard } from '../../common/rate-limit.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthRepository, AuthService, SessionAuthGuard, RateLimitGuard],
})
export class AuthModule {}
