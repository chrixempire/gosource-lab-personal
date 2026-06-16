import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsMongoId,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  RequestPaymentStatus,
  RequestStatus,
} from '../../infrastructure/mongo/schemas/request.schema';

export const requestStatuses = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export const requestPaymentStatuses = ['pending', 'paid'] as const;

class RequestAddressDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  streetAddress!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  directions?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  state!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  lga!: string;
}

class RequestProductDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  productName!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateRequestDto {
  @IsMongoId()
  branchId!: string;

  @ValidateNested()
  @Type(() => RequestAddressDto)
  address!: RequestAddressDto;

  @IsNotEmpty()
  @IsString()
  @MinLength(7)
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentMethod?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  serviceCharge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RequestProductDto)
  products!: RequestProductDto[];
}

export class ListRequestsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  status?: string;

  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountTo?: number;
}

export class RejectRequestDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  rejectionReasons!: string;
}

export class UpdateRequestPaymentDto {
  @IsOptional()
  @IsIn(requestPaymentStatuses)
  paymentStatus?: RequestPaymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentMethod?: string;
}
