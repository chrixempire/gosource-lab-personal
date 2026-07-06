import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { Admin } from '../auth/decorator/admin.decorator';
import { Roles } from '../auth/decorator/role.decorator';
import { AdminRoles } from '../auth/enum/admin.enum';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';
import { RequiredPermission } from '../role/enum/required-permission';
import { SkipActivityLog } from '../../activity/skip-activity-log.decorator';
import {
  AdminMessageQueryDto,
  CreateAdminMessageDto,
  UpdateAdminAlertDto,
} from './dto/message.dto';
import { AdminMessagingService } from './messaging.service';

@Controller('admin/messaging')
@AdminAuth()
@ApiTags('Admin / Messaging')
export class AdminMessagingController {
  constructor(private readonly messagingService: AdminMessagingService) {}

  @Post()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_MESSAGES)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with message detail
  create(@Body() dto: CreateAdminMessageDto, @Admin() admin: any) {
    return this.messagingService.create(dto, admin);
  }

  @Get()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_MESSAGES)
  @UseGuards(AdminRolesGuard)
  findAll(@Query() query: AdminMessageQueryDto) {
    return this.messagingService.findAll(query);
  }

  @Get('stats')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_MESSAGES)
  @UseGuards(AdminRolesGuard)
  getStats() {
    return this.messagingService.getStats();
  }

  @Get(':messageId')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_MESSAGES)
  @UseGuards(AdminRolesGuard)
  findOne(@Param('messageId') messageId: string) {
    return this.messagingService.findOne(messageId);
  }

  @Patch(':messageId')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.EDIT_MESSAGES)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with field old→new
  updateAlert(
    @Param('messageId') messageId: string,
    @Body() dto: UpdateAdminAlertDto,
    @Admin() admin: any,
  ) {
    return this.messagingService.updateAlert(messageId, dto, admin);
  }

  @Patch(':messageId/resend')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.RESEND_MESSAGES)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with message detail
  resend(@Param('messageId') messageId: string, @Admin() admin: any) {
    return this.messagingService.resend(messageId, admin);
  }

  @Patch(':messageId/activate')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.TOGGLE_MESSAGES)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with message detail
  activate(@Param('messageId') messageId: string, @Admin() admin: any) {
    return this.messagingService.activate(messageId, admin);
  }

  @Patch(':messageId/deactivate')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.TOGGLE_MESSAGES)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with message detail
  deactivate(@Param('messageId') messageId: string, @Admin() admin: any) {
    return this.messagingService.deactivate(messageId, admin);
  }

  @Delete(':messageId')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.DELETE_MESSAGES)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with message detail
  remove(@Param('messageId') messageId: string, @Admin() admin: any) {
    return this.messagingService.remove(messageId, admin);
  }
}
