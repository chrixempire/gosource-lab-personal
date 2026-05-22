import { Controller, Param, UseGuards, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OrderService } from './order.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Employee } from 'src/employee/decorators/employee.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { Business } from '../business/decorator/business.decorator';
import { QueryParamsDto } from '../analytics/dto/query-param.dto';

@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Order')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('summary')
  orderSummary(@Employee() employee: any) {
    return this.orderService.orderSummary(employee.branch);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto, @Business() business: any) {
    return this.orderService.findAll(query, business);
  }

  @Get(':id/invoice')
  async downloadInvoice(
    @Param('id') id: string,
    @Business() business: any,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.orderService.downloadInvoice(id, business);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=order_invoice_${id}.pdf`,
    });
    res.send(pdfBuffer);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Get(':orderId/timeline')
  @UseGuards(AuthGuard)
  async getOrderTimeline(@Param('orderId') orderId: string) {
    return await this.orderService.getTimeline(orderId);
  }
}
