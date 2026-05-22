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

// Custom validator to check for unique product IDs
@ValidatorConstraint({ name: 'isUniqueProduct', async: false })
class IsUniqueProductConstraint implements ValidatorConstraintInterface {
  validate(products: { product: string }[]) {
    const productIds = products.map((item) => item.product);
    const uniqueProductIds = new Set(productIds); // Remove duplicates
    return uniqueProductIds.size === productIds.length; // Check if lengths match
  }

  defaultMessage() {
    return 'Each product in the products array must have a unique product ID.';
  }
}

class ProductItemDto {
  @IsNotEmpty()
  @IsMongoId() // Validate as a MongoDB ObjectId
  product: string;

  @IsNotEmpty()
  @IsNumber()
  totalPrice: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

export class CreatePurchaseOrderDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductItemDto)
  @Validate(IsUniqueProductConstraint) // Apply custom unique validation
  products: ProductItemDto[];

  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true }) // Validate each item as a MongoDB ObjectId
  suppliers: string[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsDateString()
  expectedDate: string;

  @IsNotEmpty()
  @IsEnum(ProductTypeEnum)
  productType: string;

  @IsNotEmpty()
  @IsNumber()
  logisticsAmount: number;
}
