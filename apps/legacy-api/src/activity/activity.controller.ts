import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';

import { FilterActivityDto } from './dto/filter-activity.dto';
import { AdminRolesGuard } from '../admin/auth/guard/adminRole.guard';
import { AuthGuard } from '../auth/auth.guard';
@Controller('admin/activity')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get()
  @UseGuards(AuthGuard, AdminRolesGuard)
  async getActivities(@Query() queryParams: FilterActivityDto) {
    return await this.activityService.findAll(queryParams);
  }
}
