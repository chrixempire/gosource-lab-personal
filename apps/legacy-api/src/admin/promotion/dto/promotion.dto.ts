import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Types } from 'mongoose';
import { Transform, Type } from 'class-transformer';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  icon: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  startDate: Date;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  endDate: Date;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  isPercentageDiscounted?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  discountValue?: number;

  @IsMongoId({ each: true })
  @IsOptional()
  @ApiProperty()
  products?: Types.ObjectId[];
}

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {}

export class PromotionFilterParams {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty()
  page: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty()
  limit: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (value == null || value === '') {
      return undefined;
    }
    return Array.isArray(value) ? value : [value];
  })
  @ApiProperty()
  status?: string[];

  @IsString()
  @IsOptional()
  @ApiProperty()
  startDate?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  endDate?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  name?: string;
}
