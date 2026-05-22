import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminRolesGuard } from '../../auth/guard/adminRole.guard';
import { AdminAuth } from '../../auth/decorator/admin-auth.decorator';
import { ActivityService } from '../../../activity/activity.service';
import { FilterActivityDto } from '../../../activity/dto/filter-activity.dto';
import { AdminRoles } from '../../auth/enum/admin.enum';
import { Roles } from '../../auth/decorator/role.decorator';
import { RequiredPermission } from '../../role/enum/required-permission';

@Controller('admin/activity')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get()
  @AdminAuth()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_ACTIVITY_LOGS)
  @UseGuards(AdminRolesGuard)
  async getActivities(@Query() queryParams: FilterActivityDto) {
    return await this.activityService.findAll(queryParams);
  }
}
