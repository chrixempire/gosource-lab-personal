import {
  IsArray,
  IsNotEmpty,
  ValidateNested,
  IsMongoId,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReceivedItemDto {
  @IsNotEmpty()
  @IsMongoId()
  productId: string; // ID of the product in the cart

  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Quantity received must be at least 1' })
  quantityReceived: number; // Quantity received for this product
}

export class ReceivedItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivedItemDto)
  receivedItems: ReceivedItemDto[]; // Array of received items
}
