import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { PaystackService } from './paystack.service';

@Controller('paystack')
export class PaystackController {
  constructor(private paystackService: PaystackService) {}

  @HttpCode(200)
  @Post('webhook')
  async processPaystackWebhook(@Body() data: any, @Req() req: Request) {
    return await this.paystackService.processPaystackWebhook(data, req);
  }
}
