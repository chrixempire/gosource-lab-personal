import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import slugify from 'slugify';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  desc: string;

  @Prop({ required: false })
  image: string;

  @Prop({ required: false, default: 0, unique: true })
  position: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.pre<CategoryDocument>('validate', function (next) {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

CategorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
});
CategorySchema.set('toObject', { virtuals: true });
CategorySchema.set('toJSON', { virtuals: true });
