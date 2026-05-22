import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CustomerLoginDto,
  CustomerPasswordResetEmailDto,
  CustomerRefreshTokenDto,
  CustomerResetPasswordDto,
  CustomerResendOtpDto,
  CustomerLogoutDto,
  CustomerSetupAccountDto,
  CustomerSignupDto,
  CustomerVerifyPasswordOtpDto,
  CustomerVerifyOtpDto,
} from './auth.dto';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionPrincipalParam } from './session-principal.decorator';
import type { SessionPrincipal } from './session-auth.guard';
import { RateLimit } from '../../common/rate-limit.decorator';
import { RateLimitGuard } from '../../common/rate-limit.guard';

@Controller('auth')
@UseGuards(RateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @RateLimit({ limit: 5, windowMs: 60_000 })
  async signup(@Body() data: CustomerSignupDto) {
    return this.authService.signup(data);
  }

  @Post('resend-otp')
  @RateLimit({ limit: 5, windowMs: 60_000 })
  async resendOtp(@Body() data: CustomerResendOtpDto) {
    return this.authService.resendOtp(data);
  }

  @Post('verify-otp')
  @RateLimit({ limit: 10, windowMs: 60_000 })
  async verifyOtp(@Body() data: CustomerVerifyOtpDto) {
    return this.authService.verifyOtp(data);
  }

  @Patch('setup-account')
  @RateLimit({ limit: 5, windowMs: 60_000 })
  async setupAccount(@Body() data: CustomerSetupAccountDto) {
    return this.authService.setupAccount(data);
  }

  @Post('login')
  @RateLimit({ limit: 10, windowMs: 60_000 })
  async login(@Body() data: CustomerLoginDto) {
    return this.authService.login(data);
  }

  @Post('send-password-email')
  @RateLimit({ limit: 5, windowMs: 60_000 })
  async sendPasswordEmail(@Body() data: CustomerPasswordResetEmailDto) {
    return this.authService.sendPasswordEmail(data);
  }

  @Post('verify-password-otp')
  @RateLimit({ limit: 10, windowMs: 60_000 })
  async verifyPasswordOtp(@Body() data: CustomerVerifyPasswordOtpDto) {
    return this.authService.verifyPasswordOtp(data);
  }

  @Post('reset-password')
  @RateLimit({ limit: 5, windowMs: 60_000 })
  async resetPassword(@Body() data: CustomerResetPasswordDto) {
    return this.authService.resetPassword(data);
  }

  @Post('refresh')
  @RateLimit({ limit: 20, windowMs: 60_000 })
  async refresh(@Body() data: CustomerRefreshTokenDto) {
    return this.authService.refresh(data);
  }

  @Post('logout')
  @RateLimit({ limit: 20, windowMs: 60_000 })
  async logout(@Body() data: CustomerLogoutDto) {
    return this.authService.logout(data);
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  async me(@SessionPrincipalParam() principal: SessionPrincipal) {
    return this.authService.me(principal);
  }
}
