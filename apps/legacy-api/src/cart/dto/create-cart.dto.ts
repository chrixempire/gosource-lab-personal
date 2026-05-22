import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCartDto {
  @IsNotEmpty()
  productId: string;

  @IsNotEmpty()
  quantity: number;

  @IsOptional()
  branchId: string;

  @IsNotEmpty()
  unit: string;
}
