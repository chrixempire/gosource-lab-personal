import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Patch,
  Res,
  Req,
  HttpCode,
} from '@nestjs/common';
import { PurchaseOrderService } from './purchaseorder.service';
import { CreatePurchaseOrderDto } from './dto/create-purchaseorder.dto';
import { Roles } from '../auth/decorator/role.decorator';
import { AdminRoles } from '../auth/enum/admin.enum';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';
import { ReceivedItemsDto } from './dto/other.dto';
import { Response } from 'express';
import { UpdatePurchaseOrderDto } from './dto/update-purchaseorder.dto';
import { FilterPurchaseOrderDto } from './dto/filter - purchaseorder.dto';
import { plainToInstance } from 'class-transformer';
import { RequiredPermission } from '../role/enum/required-permission';

@Controller('admin/purchase-order')
@AdminAuth()
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.CREATE_UPDATE_PURCHASE_ORDER,
  )
  @UseGuards(AdminRolesGuard)
  create(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
    @Req() request: Request,
  ) {
    return this.purchaseOrderService.create(createPurchaseOrderDto, request);
  }

  @Get()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_PURCHASE_ORDERS)
  @UseGuards(AdminRolesGuard)
  findAll(@Query() queryParams: FilterPurchaseOrderDto) {
    queryParams.filterOperator = queryParams.filterOperator || 'AND';
    const filterPurchaseOrderDto = plainToInstance(
      FilterPurchaseOrderDto,
      queryParams,
    );
    return this.purchaseOrderService.findAll(filterPurchaseOrderDto);
  }

  @Get(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_PURCHASE_ORDERS)
  @UseGuards(AdminRolesGuard)
  findOne(@Param('id') id: string): Promise<{
    status: boolean;
    message: string;
    data: Record<string, unknown>;
  }> {
    return this.purchaseOrderService.getSinglePurchaseOrder(id);
  }

  @Post(':id/cancel-remaining-items')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.CREATE_UPDATE_PURCHASE_ORDER,
  )
  @UseGuards(AdminRolesGuard)
  cancelRemainingItems(@Param('id') id: string) {
    return this.purchaseOrderService.cancelRemainingItems(id);
  }

  @Post(':id/receive-items')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.CREATE_UPDATE_PURCHASE_ORDER,
  )
  @UseGuards(AdminRolesGuard)
  receivedItems(
    @Param('id') id: string,
    @Body() receivedItemsDto: ReceivedItemsDto,
  ) {
    return this.purchaseOrderService.receiveItems(id, receivedItemsDto);
  }

  @Post(':id/send-receipt')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.CREATE_UPDATE_PURCHASE_ORDER,
  )
  @UseGuards(AdminRolesGuard)
  sendReceipt(@Param('id') id: string, @Req() request: Request) {
    return this.purchaseOrderService.resendReceiptEmail(id, request.headers);
  }

  @Get(':id/send-invoice')
  @HttpCode(200)
  async sendInvoice(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.purchaseOrderService.sendInvoice(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=purchase_order_invoice_${id}.pdf`,
    });

    res.send(pdfBuffer);
  }

  @Delete(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.DELETE_PURCHASE_ORDER)
  @UseGuards(AdminRolesGuard)
  remove(@Param('id') id: string) {
    return this.purchaseOrderService.remove(id);
  }

  @Delete(':purchaseOrderId/products/:productId')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.CREATE_UPDATE_PURCHASE_ORDER,
  )
  @UseGuards(AdminRolesGuard)
  async removeSingleItem(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Param('productId') productId: string,
  ) {
    return this.purchaseOrderService.removeSingleItem(
      purchaseOrderId,
      productId,
    );
  }

  @Patch(':id')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.CREATE_UPDATE_PURCHASE_ORDER,
  )
  @UseGuards(AdminRolesGuard)
  async updatePurchaseOrder(
    @Param('id') purchaseOrderId: string,
    @Body() purchaseOrderData: UpdatePurchaseOrderDto,
  ) {
    return await this.purchaseOrderService.update(
      purchaseOrderId,
      purchaseOrderData,
    );
  }

  @Patch(':id/mark-all-received')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.CREATE_UPDATE_PURCHASE_ORDER,
  )
  @UseGuards(AdminRolesGuard)
  async markAllItemsAsReceived(@Param('id') purchaseOrderId: string) {
    return this.purchaseOrderService.markAllItemsAsReceived(purchaseOrderId);
  }
}
