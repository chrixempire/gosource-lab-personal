import { Body, Controller, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  BusinessLogin,
  NewAccountSetupInterface,
  VerifyOtpInterface,
} from './interface/auth.interface';
import { ApiTags } from '@nestjs/swagger';
import {
  IVerifyOtp,
  NewBusinessDto,
  NewPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async register(@Body() data: NewBusinessDto) {
    return await this.authService.register(data);
  }

  @Post('resend-otp')
  async resendOtp(@Body() data: any) {
    return await this.authService.resendOtp(data);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() data: VerifyOtpInterface) {
    return await this.authService.verifyOtp(data);
  }

  @Post('login')
  async login(@Body() data: BusinessLogin) {
    return await this.authService.login(data);
  }

  @Patch('setup-account')
  async setupAccount(@Body() data: NewAccountSetupInterface) {
    return await this.authService.setupAccount(data);
  }

  @Post('send-password-email')
  async sendPasswordMail(@Body() data: ResetPasswordDto) {
    return await this.authService.sendPasswordResetMail(data);
  }

  @Post('verify-password-otp')
  async verifyPasswordOtp(@Body() data: IVerifyOtp) {
    return await this.authService.verifyPasswordOtp(data);
  }

  @Post('reset-password')
  async resetPassword(@Body() data: NewPasswordDto) {
    return await this.authService.resetPassword(data);
  }

  @Post('send-email')
  async sendEmail(@Body() data: any) {
    return await this.authService.sendContactEmail(data);
  }
}
