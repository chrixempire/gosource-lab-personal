import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { CouponCategory, CouponType } from '../coupon.enum';

export class CreateCouponDto {
  @IsOptional()
  code: string;

  @IsNotEmpty()
  @IsEnum(CouponType)
  type: string;

  @IsOptional()
  discount: number;

  @IsNotEmpty()
  @IsEnum(CouponCategory)
  category: string;

  @IsNotEmpty()
  startDate: Date;

  @IsOptional()
  endDate: Date;

  @IsOptional()
  title: string;

  @IsOptional()
  target: string;

  @IsOptional()
  @IsNumber()
  minimumOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @IsOptional()
  applicableItems?: any[];

  @IsOptional()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  comboItems?: string[];

  @IsOptional()
  @IsNumber()
  loyaltyPointsRequired?: number;
}

export class ApplyCouponDto {
  @IsNotEmpty()
  code: string;
}
