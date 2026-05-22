import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PromotionDocument = HydratedDocument<Promotion>;

@Schema({ timestamps: true })
export class Promotion {
  @Prop({ required: true })
  @ApiProperty()
  name: string;

  @Prop({ required: true })
  @ApiProperty()
  description: string;

  @Prop()
  @ApiProperty()
  icon: string;

  @Prop({ required: true })
  @ApiProperty()
  startDate: Date;

  @Prop({ required: true })
  @ApiProperty()
  endDate: Date;

  @Prop({ required: false, default: false })
  @ApiProperty()
  isPercentageDiscounted: boolean;

  // Discount value is the percentage of discount
  @Prop({ required: false, default: 0 })
  @ApiProperty()
  discountValue: number;

  @Prop({ required: true })
  @ApiProperty()
  isActive: boolean;

  @Prop({ required: false, default: false })
  @ApiProperty()
  isDeactivatedManually: boolean;

  @Prop({ required: true, type: [Types.ObjectId], ref: 'Product' })
  @ApiProperty()
  products: Types.ObjectId[];
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);

PromotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
