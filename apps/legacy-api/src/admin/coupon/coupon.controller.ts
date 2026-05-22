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
import { Roles } from '../auth/decorator/role.decorator';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { AdminRoles } from '../auth/enum/admin.enum';
import { QueryParamsDto } from '../../analytics/dto/query-param.dto';
import { CouponService } from './coupon.service';
import { ApplyCouponDto, CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Business } from '../../business/decorator/business.decorator';
import { RequiredPermission } from '../role/enum/required-permission';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';

@Controller('admin/coupon')
@AdminAuth()
export class CouponController {
  constructor(private couponService: CouponService) {}

  @Post()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_DISCOUNT)
  @UseGuards(AdminRolesGuard)
  async createCoupon(@Body() couponDetails: CreateCouponDto) {
    return await this.couponService.createCoupon(couponDetails);
  }

  @Get()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_DISCOUNTS)
  @UseGuards(AdminRolesGuard)
  async getCategories(@Query() queryParams: QueryParamsDto) {
    return await this.couponService.getCoupons(queryParams);
  }

  @Patch(':id/deactivate')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.ACTIVATE_DEACTIVATE_DISCOUNT,
  )
  @UseGuards(AdminRolesGuard)
  async deactivateDiscount(@Param('id') discountId: string) {
    return this.couponService.deactivateDiscount(discountId);
  }

  @Patch(':id/activate')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.ACTIVATE_DEACTIVATE_DISCOUNT,
  )
  @UseGuards(AdminRolesGuard)
  async activateDiscount(@Param('id') discountId: string) {
    return this.couponService.activateDiscount(discountId);
  }

  @Get(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_DISCOUNTS)
  @UseGuards(AdminRolesGuard)
  async getSingleCoupon(@Param('id') couponId: string) {
    return await this.couponService.getSingleCoupon(couponId);
  }

  @Patch(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_DISCOUNT)
  @UseGuards(AdminRolesGuard)
  async updateCoupon(
    @Param('id') couponId: string,
    @Body() couponData: UpdateCouponDto,
  ) {
    return await this.couponService.updateCoupon(couponId, couponData);
  }

  @Delete(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.DELETE_DISCOUNT)
  @UseGuards(AdminRolesGuard)
  async deleteCoupon(@Param('id') couponId: string) {
    return await this.couponService.removeCoupon(couponId);
  }

  @Post('apply/:id/request')
  async applyCoupon(
    @Param('id') requestId: string,
    @Body() couponDetails: ApplyCouponDto,
    @Business() business: any,
  ) {
    return await this.couponService.applyCoupon(
      requestId,
      couponDetails,
      business,
    );
  }
}
