import { ApiProperty } from '@nestjs/swagger';
import { Cart } from 'src/cart/entities/cart.entity';
import { Address } from '../entities/order.entity';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Selected Cart Products',
    type: [Cart],
  })
  products: [Cart];

  @ApiProperty({
    description: 'Phone Numbers',
  })
  phoneNumbers: [string];

  @ApiProperty({
    description: 'Address',
  })
  address: Address;

  @ApiProperty({
    description: 'payment Method',
  })
  paymentMethod: string;

  @ApiProperty({
    description: 'Delivery Fee',
  })
  deliveryFee: number;

  @ApiProperty({
    description: 'Service Charge',
  })
  serviceCharge: number;

  @ApiProperty({
    description: 'Coupon',
  })
  coupon: boolean;

  @ApiProperty({
    description: 'Reference',
  })
  reference: string;
}
