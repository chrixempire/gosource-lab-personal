import { IsNotEmpty } from 'class-validator';

export class CreateItemDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  actualPrice: number;

  @IsNotEmpty()
  discountPrice: number;

  @IsNotEmpty()
  inStock: boolean;

  @IsNotEmpty()
  brand: string;

  @IsNotEmpty()
  unit: string;

  @IsNotEmpty()
  category: string;
}

export class CreateUnitDto {
  @IsNotEmpty()
  name: string;
}
