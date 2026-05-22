import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import {
  IsNumber,
  IsArray,
  ValidateNested,
  IsString,
  Min,
  IsOptional,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../../order/enum/order.enum';
import { ORDER_PAYMENT_STATUS } from '../../../order/interface/order.interface';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatus {
  @IsEnum(OrderStatus)
  status: string;
}

export class UpdatePaymentStatus {
  @IsEnum(ORDER_PAYMENT_STATUS)
  status: string;
}

export class CancelOrder {
  @IsNotEmpty()
  reason: string;
}

export class AddNewProductsDto {
  @IsNotEmpty()
  @IsMongoId()
  orderId: string;

  @IsNotEmpty()
  products: [];
}

export class ProductQuantityUpdateDto {
  @IsString()
  cartId: string;

  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  newQuantity: number;

  @IsString()
  @IsOptional()
  unit: string;
}

export class UpdateOrderProductsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductQuantityUpdateDto)
  products: ProductQuantityUpdateDto[];

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateOrderFeesDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class MarkDeliveredProductsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  cartIds: string[];
}
