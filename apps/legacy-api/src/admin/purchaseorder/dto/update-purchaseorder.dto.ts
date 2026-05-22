import {
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsDateString,
  IsMongoId,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductTypeEnum } from '../interface/purchaseorder.interface';

@ValidatorConstraint({ name: 'isUniqueProduct', async: false })
class IsUniqueProductConstraint implements ValidatorConstraintInterface {
  validate(products: { product: string }[]) {
    const productIds = products.map((item) => item.product);
    const uniqueProductIds = new Set(productIds);
    return uniqueProductIds.size === productIds.length;
  }

  defaultMessage() {
    return 'Each product in the products array must have a unique product ID.';
  }
}

class ProductItemDto {
  @IsNotEmpty()
  @IsMongoId()
  product: string;

  @IsNotEmpty()
  @IsNumber()
  totalPrice: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

export class UpdatePurchaseOrderDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductItemDto)
  @Validate(IsUniqueProductConstraint)
  products: ProductItemDto[];

  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  suppliers: string[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @IsNotEmpty()
  @IsEnum(ProductTypeEnum)
  productType: string;

  @IsOptional()
  @IsNumber()
  logisticsAmount?: number;
}
