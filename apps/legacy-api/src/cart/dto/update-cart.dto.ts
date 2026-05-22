import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateCartDto {
  @IsPositive()
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 0 })
  @ApiProperty({
    description: 'Cart Item quantity',
    default: 1,
  })
  quantity: number;

  @IsOptional()
  unit?: string;
}
