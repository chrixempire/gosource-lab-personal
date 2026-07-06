import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../enum/request.enum';

export class CreateRequestDto {
  /** Legacy web clients send `branch`; customer-web proxy may send `branchId`. */
  @IsOptional()
  branch?: string;

  @IsOptional()
  branchId?: string;

  @IsNotEmpty()
  address: object;

  @IsOptional()
  paymentMethod: string;

  @IsNotEmpty()
  phoneNumber: string;

  @IsOptional()
  coupon: boolean;

  @IsOptional()
  deliveryFee: number;

  @IsOptional()
  serviceCharge: number;
}

export class UpdateRequestDto {
  @IsOptional()
  branch: string;

  @IsOptional()
  address: object;

  @IsOptional()
  paymentMethod: string;

  @IsOptional()
  phoneNumber: string;

  @IsOptional()
  coupon: boolean;

  @IsOptional()
  deliveryFee: number;

  @IsOptional()
  serviceCharge: number;

  @IsOptional()
  status: string;
}

export class RejectRequestDto {
  @IsNotEmpty()
  rejectionReasons: string;
}

export class updateQuantityDto {
  @IsNotEmpty()
  requestId: string;

  @IsNotEmpty()
  cartId: string;

  @IsNotEmpty()
  quantity: number;

  @IsOptional()
  unit: string;
}

export class addProductDto {
  @IsNotEmpty()
  requestId: string;

  @IsNotEmpty()
  productId: string;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  unit: string;
}

export class ApproveRequestDto {
  @IsOptional()
  coupon: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: string;

  /** Confirmed Paystack transaction reference; verified server-side to mark the
   * order paid on approval (webhook-independent). */
  @IsOptional()
  @IsString()
  paystackReference?: string;
}
