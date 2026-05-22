import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderDto {
  @ApiProperty({
    description: 'Employee branch',
  })
  approved: boolean;
}
export class UpdateProductOrderQuantityDto {
  @ApiProperty({
    description: 'Quantity',
  })
  quantity: number;
}
