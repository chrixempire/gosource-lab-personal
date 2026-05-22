import {
  Body,
  Controller,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { AdminAuth } from './decorator/admin-auth.decorator';
import { Admin } from './decorator/admin.decorator';
import {
  CompletePasswordResetDto,
  InitiatePasswordResetDto,
  SetAdminPasswordDto,
  VerifyOTPDto,
} from './dto/set-password.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRefreshTokenDto } from './dto/admin-refresh-token.dto';
import { AdminRolesGuard } from './guard/adminRole.guard';
import { CreateAdminRoleDto } from './dto/create-role.dto';
import { AdminRoles } from './enum/admin.enum';
import { Roles } from './decorator/role.decorator';
import { ResendInviteDto } from './dto/admin.dto';
import { RequiredPermission } from '../role/enum/required-permission';

@ApiExcludeController()
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly adminAuthService: AuthService) {}

  @Post('register')
  @AdminAuth()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_ADMIN_MEMBERS)
  @UseGuards(AdminRolesGuard)
  async register(@Body() adminData: CreateAdminDto) {
    return await this.adminAuthService.createAdmin(adminData);
  }

  @UseGuards(AuthGuard)
  @Patch('complete-admin-signup')
  async completeAdminRegistration(
    @Body() data: SetAdminPasswordDto,
    @Admin() admin: any,
  ) {
    return await this.adminAuthService.setAdminPassword(data, admin.id);
  }

  @Post('login')
  async login(@Body() data: AdminLoginDto) {
    return await this.adminAuthService.login(data);
  }

  @HttpCode(200)
  @Post('refresh')
  async refresh(@Body() data: AdminRefreshTokenDto) {
    return await this.adminAuthService.refresh(data);
  }

  @AdminAuth()
  @UseGuards(AdminRolesGuard)
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_ADMIN_ROLE)
  @Post('create-admin-role')
  async createNewAdminRole(@Body() data: CreateAdminRoleDto) {
    return await this.adminAuthService.createNewAdminRole(data);
  }

  @HttpCode(200)
  @Post('initiate-password-reset')
  async initiatePasswordReset(@Body() data: InitiatePasswordResetDto) {
    return await this.adminAuthService.initiatePasswordReset(data);
  }

  @HttpCode(200)
  @Post('complete-password-reset')
  async completePasswordReset(@Body() data: CompletePasswordResetDto) {
    return await this.adminAuthService.completePasswordReset(data);
  }

  @HttpCode(200)
  @Post('verify-otp')
  async verifyOTP(@Body() data: VerifyOTPDto) {
    return await this.adminAuthService.verifyOTP(data);
  }

  @AdminAuth()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_ADMIN_MEMBERS)
  @UseGuards(AdminRolesGuard)
  @Post('resend-invite')
  async resendInvite(@Body() data: ResendInviteDto) {
    return await this.adminAuthService.resendActivateInvite(data);
  }
}
