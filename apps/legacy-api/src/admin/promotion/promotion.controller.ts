import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { Roles } from '../auth/decorator/role.decorator';
import { AdminRoles } from '../auth/enum/admin.enum';
import { RequiredPermission } from '../role/enum/required-permission';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';
import { UseGuards } from '@nestjs/common';
import {
  CreatePromotionDto,
  PromotionFilterParams,
  UpdatePromotionDto,
} from './dto/promotion.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Promotion } from '../../promotion/schemas/promotion.schema';
import { Admin } from '../auth/decorator/admin.decorator';
import { SkipActivityLog } from '../../activity/skip-activity-log.decorator';

@Controller('admin/promotion')
@AdminAuth()
@ApiTags('Admin / Promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_PROMOTION)
  @UseGuards(AdminRolesGuard)
  @ApiCreatedResponse({ type: Promotion })
  async create(@Body() createPromotionDto: CreatePromotionDto) {
    return await this.promotionService.create(createPromotionDto);
  }

  @Post(':id/duplicate')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_PROMOTION)
  @UseGuards(AdminRolesGuard)
  @ApiCreatedResponse({ type: Promotion })
  async duplicate(@Param('id') id: string) {
    return await this.promotionService.duplicate(id);
  }

  @Get()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_PROMOTIONS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({ type: [Promotion] })
  async findAll(@Query() query: PromotionFilterParams) {
    return await this.promotionService.findAll(query);
  }

  @Get(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_PROMOTIONS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({ type: Promotion })
  async findOne(@Param('id') id: string) {
    return await this.promotionService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_PROMOTION)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({ type: Promotion })
  @SkipActivityLog() // logged explicitly with field old→new
  async update(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
    @Admin() admin: any,
  ) {
    return await this.promotionService.update(id, updatePromotionDto, admin);
  }

  @Patch(':id/activate')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.ACTIVATE_DEACTIVATE_PROMOTION)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({ type: Promotion })
  async activate(@Param('id') id: string) {
    return await this.promotionService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.ACTIVATE_DEACTIVATE_PROMOTION)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({ type: Promotion })
  async deactivate(@Param('id') id: string) {
    return await this.promotionService.deactivate(id);
  }

  @Delete(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.DELETE_PROMOTION)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({ type: Promotion })
  async remove(@Param('id') id: string) {
    return await this.promotionService.remove(id);
  }
}
