import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { Roles } from '../auth/decorator/role.decorator';
import { AdminRoles } from '../auth/enum/admin.enum';
import { ChangeRoleStatusDto } from '../auth/dto/admin.dto';
import { Admin } from '../auth/decorator/admin.decorator';
import { SearchAdminsDto } from './dto/search-admins.dto';
import {
  ChangePasswordDto,
  UpdateProfileDto,
  UpdateProfileSuperAdminDto,
} from './dto/update-profile.dto';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';
import { RequiredPermission } from '../role/enum/required-permission';
import { SkipActivityLog } from '../../activity/skip-activity-log.decorator';

@Controller('admin/admin')
@AdminAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async getAdmin() {
    return await this.adminService.getAdmins();
  }

  @Get('profile')
  async getSingle(@Admin() admin: any) {
    return await this.adminService.getSingleAdmin(admin.id);
  }

  @Get('stats')
  @Roles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  async getStats() {
    return await this.adminService.getStats();
  }

  @Get('search')
  async searchAdmins(@Query() searchParams: SearchAdminsDto) {
    return await this.adminService.searchAdmins(searchParams);
  }

  @Patch('profile')
  async updateProfile(@Admin() admin: any, @Body() body: UpdateProfileDto) {
    return await this.adminService.updateProfile(admin.id, body);
  }

  @Patch('change-password')
  async changePassword(@Body() data: ChangePasswordDto, @Admin() admin: any) {
    return await this.adminService.changePassword(data, admin.id);
  }

  @Get(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_ADMIN_MEMBERS)
  @UseGuards(AdminRolesGuard)
  async getSingleAdmin(@Param('id') adminId: string) {
    return await this.adminService.getSingleAdmin(adminId);
  }

  @Patch(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_ADMIN_MEMBERS)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with field old→new
  async updateProfileBySuperAdmin(
    @Param('id') adminId: string,
    @Body() body: UpdateProfileSuperAdminDto,
    @Admin() admin: any,
  ) {
    return await this.adminService.updateProfileBySuperAdmin(adminId, body, admin);
  }

  @Patch(':id/activate')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_ADMIN_MEMBERS)
  @UseGuards(AdminRolesGuard)
  async activateAdminAccount(@Param('id') adminId: string) {
    return await this.adminService.activateAdminAccount(adminId);
  }

  @Patch(':id/suspend')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_ADMIN_MEMBERS)
  @UseGuards(AdminRolesGuard)
  async suspendAdminAccount(@Param('id') adminId: string) {
    return await this.adminService.suspendAdminAccount(adminId);
  }

  @Patch(':id/update-role-status')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_ADMIN_MEMBERS)
  @UseGuards(AdminRolesGuard)
  async updateAdminRoleStatus(
    @Param('id') adminId: string,
    @Body() roleDetails: ChangeRoleStatusDto,
  ) {
    return await this.adminService.changeAdminRoleStatus(adminId, roleDetails);
  }
}
