import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { InvoiceService } from './invoice.service';
import { NewInvoiceDto } from './dto/create-invoice.dto';
import { Admin } from '../auth/decorator/admin.decorator';

@Controller('admin/invoice')
@AdminAuth()
@UseGuards(AdminRolesGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  async getAllInvoice() {
    return await this.invoiceService.getAllInvoices();
  }

  @Get(':id')
  async getSingleInvoice(@Param('id') invoiceId: string) {
    return await this.invoiceService.getSingleInvoice(invoiceId);
  }

  @Get('business/:businessId')
  async getInvoicesByBusiness(@Param('businessId') businessId: string) {
    return await this.invoiceService.getInvoicesByBusiness(businessId);
  }

  @Post()
  async createInvoice(@Body() invoiceData: NewInvoiceDto, @Admin() admin: any) {
    return await this.invoiceService.createInvoice(invoiceData, admin.id);
  }
}
