import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { DateFilterType } from '../enum/product.enum';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsOptional()
  actualPrice: number;

  @IsOptional()
  totalPrice: number;

  @IsOptional()
  discountPrice: number;

  @IsOptional()
  marketPrice: number;

  @IsOptional()
  inStock: boolean;

  @IsOptional()
  trackQuantity: boolean;

  @IsOptional()
  brand: string;

  @IsNotEmpty()
  unit: string;

  @IsOptional()
  newUnit: any[];

  @IsOptional()
  purchaseUnit: string;

  @IsNotEmpty()
  category: string;

  @IsOptional()
  quantity: number;

  @IsOptional()
  lowStockLevel: string;

  @IsOptional()
  isLowStock: boolean;

  @IsOptional()
  imageUpdates: any[];

  @IsOptional()
  imagesToRemove: any[];
}

export class CreateUnitDto {
  @IsNotEmpty()
  name: string;
}

export class CreateBatchProductDto {
  @IsNotEmpty()
  unitPrice: number;

  @IsNotEmpty()
  unit: string;

  @IsNotEmpty()
  quantity: number;
}

export class DeductBatchProductDto {
  @IsNotEmpty()
  unit: string;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  deductReason: string;
}

export class DateFilterDto {
  @IsEnum(DateFilterType)
  filterType: DateFilterType;

  @IsOptional()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  branch?: string;

  @IsOptional()
  startTime?: string;

  @IsOptional()
  endTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number;
}
