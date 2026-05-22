import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import slugify from 'slugify';
import { NextFunction } from 'express';

export type UnitDocument = HydratedDocument<Unit>;

@Schema({ timestamps: true })
export class Unit {
  @Prop({ required: true, unique: false })
  name: string;

  @Prop({ required: false })
  slug: string;
}

export const UnitSchema = SchemaFactory.createForClass(Unit);

UnitSchema.pre('save', function (next: NextFunction) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
