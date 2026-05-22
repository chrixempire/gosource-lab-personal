import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { Roles } from '../auth/decorator/role.decorator';
import { RequiredPermission } from '../role/enum/required-permission';
import { SystemConfigService } from './system-config.service';
import {
  UpdateDeliveryFeeConfigDto,
  CreateSystemConfigDto,
} from './dto/system-config.dto';
import { AdminRoles } from '../auth/enum/admin.enum';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';

@Controller('admin/system-config')
@AdminAuth()
@Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_SYSTEM_SETTINGS)
@UseGuards(AdminRolesGuard)
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  async getConfigs() {
    return await this.systemConfigService.getConfigs();
  }

  @Post()
  async createConfig(@Body() body: CreateSystemConfigDto) {
    return await this.systemConfigService.updateConfig(
      body.key,
      body.value,
      body.description,
    );
  }

  @Patch('delivery-fee')
  async updateDeliveryFeeConfig(@Body() body: UpdateDeliveryFeeConfigDto) {
    return await this.systemConfigService.updateConfig(
      'delivery_fee_config',
      body,
    );
  }

  @Delete(':key')
  async deleteConfig(@Param('key') key: string) {
    return await this.systemConfigService.deleteConfig(key);
  }
}
