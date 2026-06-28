import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrderService } from './order.service';
import { QueryParamsDto } from '../../analytics/dto/query-param.dto';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { AdminRoles } from '../auth/enum/admin.enum';
import { Roles } from '../auth/decorator/role.decorator';
import { Admin } from '../auth/decorator/admin.decorator';
import {
  AddNewProductsDto,
  CancelOrder,
  UpdateOrderStatus,
  UpdatePaymentStatus,
  UpdateOrderProductsDto,
  UpdateOrderFeesDto,
  MarkDeliveredProductsDto,
} from './dto/update-order.dto';
import { OrderFilterParams } from '../../utils/filter';
import { RequiredPermission } from '../role/enum/required-permission';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';
import { DateFilterDto } from '../product/dto/create-product.dto';
import { SkipActivityLog } from '../../activity/skip-activity-log.decorator';

@Controller('admin/order')
@AdminAuth()
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_ORDER)
  @UseGuards(AdminRolesGuard)
  async getOrdersByBranch(@Query() queryParams: QueryParamsDto) {
    return await this.orderService.getOrders(queryParams);
  }

  @Get('filtered')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_ORDER)
  @UseGuards(AdminRolesGuard)
  async getOrders(@Query() queryParams: OrderFilterParams) {
    return this.orderService.getFilteredOrders(queryParams);
  }

  @Get('dashboard-metrics')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_ORDER)
  @UseGuards(AdminRolesGuard)
  async getDashboardMetrics(@Query() query: DateFilterDto) {
    return await this.orderService.getDashboardMetrics(query);
  }

  @Patch('/add-products')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.UPDATE_ORDER_ITEMS)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with the added items
  async addProducts(@Body() details: AddNewProductsDto, @Admin() admin: any) {
    return await this.orderService.addProductsToOrder(details, admin);
  }

  @Get(':id/invoice')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_ORDER)
  @UseGuards(AdminRolesGuard)
  async downloadOrderInvoice(
    @Param('id') orderId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.orderService.downloadOrderInvoice(orderId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=order_invoice_${orderId}.pdf`,
    });
    res.send(pdfBuffer);
  }

  @Get(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_ORDER)
  @UseGuards(AdminRolesGuard)
  async getSingleOrder(@Param('id') orderId: string) {
    return await this.orderService.getSingleOrder(orderId);
  }

  @Patch(':id/update-order-status')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CHANGE_ORDER_STATUS)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with status from→to
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() statusDetails: UpdateOrderStatus,
    @Admin() admin: any,
  ) {
    return await this.orderService.updateOrderStatus(
      orderId,
      statusDetails,
      admin,
    );
  }

  @Patch(':id/cancel')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CANCEL_ORDER)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly
  async cancelOrder(
    @Param('id') orderId: string,
    @Body() details: CancelOrder,
    @Admin() admin: any,
  ) {
    return await this.orderService.cancelOrder(orderId, details, admin);
  }

  @Get(':orderId/timeline')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_ORDER)
  @UseGuards(AdminRolesGuard)
  async getOrderTimeline(@Param('orderId') orderId: string) {
    return await this.orderService.getTimeline(orderId);
  }

  @Patch(':id/update-payment-status')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CHANGE_PAYMENT_STATUS)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with payment from→to
  async updatePaymentStatus(
    @Param('id') orderId: string,
    @Body() statusDetails: UpdatePaymentStatus,
    @Admin() admin: any,
  ) {
    return await this.orderService.updatePaymentStatus(
      orderId,
      statusDetails,
      admin,
    );
  }

  @Patch(':orderId/update-order-products')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.UPDATE_ORDER_ITEMS)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with item old→new + refund
  async updateOrderProducts(
    @Param('orderId') orderId: string,
    @Body() updateOrderProductsDto: UpdateOrderProductsDto,
    @Admin() admin: any,
  ) {
    return await this.orderService.updateOrderProductsAndCalculateRefund(
      orderId,
      updateOrderProductsDto,
      admin,
    );
  }

  @Patch(':orderId/fees')
  @Roles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with fee field old→new
  async updateOrderFees(
    @Param('orderId') orderId: string,
    @Body() updateOrderFeesDto: UpdateOrderFeesDto,
    @Admin() admin: any,
  ) {
    return await this.orderService.updateOrderFees(
      orderId,
      updateOrderFeesDto,
      admin,
    );
  }

  @Get(':orderId/logs')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_ORDER)
  @UseGuards(AdminRolesGuard)
  async getLogs(
    @Param('orderId') orderId: string,
    @Query() queryParams: QueryParamsDto,
  ) {
    return await this.orderService.fetchOrderActivityLogs(orderId, queryParams);
  }

  @Patch(':orderId/mark-delivered-products')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.CHANGE_ORDER_STATUS,
    RequiredPermission.UPDATE_ORDER_ITEMS,
  )
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with status + delivered items
  async markDeliveredProducts(
    @Param('orderId') id: string,
    @Body() body: MarkDeliveredProductsDto,
    @Admin() admin: any,
  ) {
    return this.orderService.markDeliveredProducts(id, body, admin);
  }
}
