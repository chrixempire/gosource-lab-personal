import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateShoppingListDto {
  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  branchId: string;

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  name: string;

  @IsOptional()
  @ApiProperty()
  @IsString()
  description: string;
}

export class AddListItemDto {
  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  productId: Types.ObjectId;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  quantity: number;

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  unit: string;
}

export class UpdateListItemDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  unit?: string;
}

export class MoveItemsDto {
  @IsArray()
  @IsNotEmpty()
  @ApiProperty({ type: [String] })
  itemIds: string[];

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  targetListId: string;
}
