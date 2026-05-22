import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
  IsInt,
  Min,
} from 'class-validator';

export function UniqueProductIds(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'uniqueProductIds',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any[]) {
          if (!Array.isArray(value)) return false;
          const ids = value.map((item) => item.productId);
          return ids.length === new Set(ids).size;
        },
        defaultMessage() {
          return 'Duplicate productId found in countedProducts';
        },
      },
    });
  };
}

class ProductCountDto {
  @IsNotEmpty()
  @IsMongoId() // Validate as a MongoDB ObjectId
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  countedQuantity: number;
}

export class CreateStockCountDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductCountDto)
  @UniqueProductIds()
  countedProducts: ProductCountDto[];
}

export class QueryFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;
}
