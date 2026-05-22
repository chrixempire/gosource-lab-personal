import { IsNotEmpty } from 'class-validator';

export class NewInvoiceDto {
  @IsNotEmpty()
  orderId: string;

  @IsNotEmpty()
  products: string[];

  @IsNotEmpty()
  businessId: string;
}
