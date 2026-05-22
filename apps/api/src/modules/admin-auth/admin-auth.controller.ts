import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RateLimit } from '../../common/rate-limit.decorator';
import { RateLimitGuard } from '../../common/rate-limit.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './admin-auth.dto';

@Controller('admin/auth')
@UseGuards(RateLimitGuard)
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @RateLimit({ limit: 5, windowMs: 60_000 })
  async login(@Body() data: AdminLoginDto) {
    return this.adminAuthService.login(data);
  }
}
