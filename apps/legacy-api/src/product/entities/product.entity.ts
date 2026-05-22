import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import slugify from 'slugify';
import { NextFunction } from 'express';
import { Category } from 'src/category/entities/category.entity';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: false, trim: true })
  name: string;

  @Prop({ required: false, trim: true, unique: false })
  description: string;

  @Prop({ required: false })
  actualPrice: number;

  @Prop({ required: false })
  discountPrice: number;

  @Prop({ default: 0 })
  totalPrice: number;

  @Prop({ default: 0 })
  marketPrice: number;

  @Prop({ default: 0 })
  quantity: number;

  @Prop({ default: null })
  specialPrices: Record<string, any>[];

  @Prop({ required: false, default: true })
  inStock: boolean;

  @Prop({ default: true })
  active: boolean;

  @Prop({ required: false, default: false })
  isLowStock: boolean;

  @Prop({ required: false, default: 4 })
  lowStockLevel: number;

  @Prop({ required: false, trim: true })
  brand: string;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: false, default: null })
  newUnit: string;

  @Prop({ required: false })
  purchaseUnit: string;

  @Prop({ required: false })
  version: string;

  @Prop()
  images: Record<string, any>[];

  @Prop({ required: false })
  slug: string;

  @Prop({
    required: false,
    type: mongoose.Schema.Types.Mixed,
    ref: Category.name,
  })
  category: Category | string;

  @Prop({ required: false, default: false })
  coupon: boolean;

  @Prop({ default: false })
  trackQuantity: boolean;

  @Prop({ required: false })
  discountedUnit: string;

  @Prop({
    required: false,
    type: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' }, // fix circular deps between product and promotion
      name: { type: String },
      slug: { type: String },
      isPercentageDiscounted: { type: Boolean },
      discountValue: { type: Number },
    },
  })
  promotion: {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    isPercentageDiscounted: boolean;
    discountValue: number;
  };
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.pre('save', function (next: NextFunction) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Custom getter for category
ProductSchema.virtual('categoryInfo').get(function () {
  return typeof this.category === 'string'
    ? { name: this.category }
    : this.category;
});

// Ensure virtuals are included when converting document to JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });
