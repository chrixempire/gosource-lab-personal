import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { CouponCategory, CouponType, DiscountTarget } from '../coupon.enum';

export type CouponDocument = mongoose.HydratedDocument<Coupon>;
@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: false, unique: false })
  code: string;

  @Prop({
    required: true,
    enum: CouponType,
  })
  type: string;

  @Prop({ required: true, enum: DiscountTarget })
  target: string;

  @Prop({ required: false })
  title: string;

  @Prop({ required: true })
  discount: number;

  @Prop({ required: true, enum: CouponCategory })
  category: string;

  @Prop({ required: false })
  expiryDate?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  partialComboAllowed: boolean;

  @Prop()
  loyaltyPointsRequired: number;

  @Prop({ required: false })
  startDate: Date;

  @Prop({ required: false })
  endDate: Date;

  @Prop({ default: false })
  isFirstTimeUserOnly: boolean;

  @Prop({ default: 0 })
  minimumOrderAmount: number;

  @Prop({ default: 1 })
  minQuantityPerItem: number;

  @Prop({ default: 0.8 })
  partialComboThreshold: number;

  @Prop({ default: -1 })
  usageLimit: number;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ type: [String], default: [] })
  applicableItems: string[];

  @Prop()
  comboItems: string[];
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
