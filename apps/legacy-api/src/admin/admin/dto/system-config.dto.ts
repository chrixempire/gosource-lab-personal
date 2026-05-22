import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateDeliveryFeeConfigDto {
  @IsNumber()
  @IsNotEmpty()
  baseFee1: number;

  @IsNumber()
  @IsNotEmpty()
  baseFee2: number;

  @IsNumber()
  @IsNotEmpty()
  threshold: number;

  @IsNumber()
  @IsNotEmpty()
  percentage1: number;

  @IsNumber()
  @IsNotEmpty()
  percentage2: number;
}

export class CreateSystemConfigDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsObject()
  @IsNotEmpty()
  value: any;

  @IsString()
  @IsOptional()
  description?: string;
}
