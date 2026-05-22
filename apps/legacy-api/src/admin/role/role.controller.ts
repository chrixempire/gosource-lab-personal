import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { Roles } from '../auth/decorator/role.decorator';
import { AdminRoles } from '../auth/enum/admin.enum';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';
import { RequiredPermission } from './enum/required-permission';
@Controller('admin/role')
@AdminAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_ADMIN_ROLE)
  @UseGuards(AdminRolesGuard)
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.roleService.create(createRoleDto);
  }

  @Get()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_ADMIN_ROLES)
  @UseGuards(AdminRolesGuard)
  async findAll() {
    return await this.roleService.findAll();
  }

  @Get('permissions')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_ADMIN_ROLES)
  @UseGuards(AdminRolesGuard)
  getGroupedPermissions() {
    return this.roleService.getGroupedPermissions();
  }

  @Get(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_ADMIN_ROLES)
  @UseGuards(AdminRolesGuard)
  async findOne(@Param('id') id: string) {
    return await this.roleService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_ADMIN_ROLE)
  @UseGuards(AdminRolesGuard)
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return await this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.DELETE_ADMIN_ROLE)
  @UseGuards(AdminRolesGuard)
  remove(@Param('id') id: string) {
    return this.roleService.remove(+id);
  }
}
