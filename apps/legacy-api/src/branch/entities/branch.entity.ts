import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BusinessCustomer } from '../../business/schema/business.schema';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { LGA } from '../interface/branch.interface';
import { Product } from '../../product/entities/product.entity';

export type BranchDocument = HydratedDocument<Branch>;

@Schema({ timestamps: true })
export class Branch {
  @Prop({ required: true })
  branchName: string;

  @Prop({ required: true, enum: LGA })
  lga: LGA;

  @Prop({ required: true })
  streetName: string;

  @Prop({ required: false })
  branchCode: string;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  businessId: BusinessCustomer;

  @Prop({ default: false })
  isHeadquarter: boolean;

  @Prop({ default: false })
  isDeactivated: boolean;

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: Product.name,
    default: [],
  })
  recentOrderProducts: mongoose.Types.ObjectId[];
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
