import { Module } from '@nestjs/common';
import { RateLimitGuard } from '../../common/rate-limit.guard';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthRepository } from './admin-auth.repository';
import { AdminAuthService } from './admin-auth.service';
import { DevAdminSeedService } from './dev-admin-seed.service';

@Module({
  controllers: [AdminAuthController],
  providers: [AdminAuthRepository, AdminAuthService, DevAdminSeedService, RateLimitGuard],
})
export class AdminAuthModule {}
