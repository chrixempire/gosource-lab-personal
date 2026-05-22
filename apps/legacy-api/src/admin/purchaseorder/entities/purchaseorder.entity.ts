import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  ProductTypeEnum,
  PurchaseOrderStatus,
} from '../interface/purchaseorder.interface';
import { Product } from '../../../product/entities/product.entity';

export type PurchaseOrderDocument = mongoose.HydratedDocument<PurchaseOrder>;
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class PurchaseOrder {
  @Prop([
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Product.name,
        required: false,
      },
      quantity: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
      quantityReceived: { type: Number, required: false, default: 0 },
    },
  ])
  products: Array<{
    product: mongoose.Schema.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    quantityReceived: number;
  }>;

  @Prop({
    required: true,
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'AdminUser',
  })
  suppliers: mongoose.Types.ObjectId[];

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
  })
  creator: mongoose.Types.ObjectId;

  @Prop({ required: false })
  note: string;

  @Prop({ default: 0 })
  logisticsAmount: number;

  @Prop({
    required: false,
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.PENDING,
  })
  status: string;

  @Prop({
    required: false,
    enum: ProductTypeEnum,
  })
  productType: string;

  @Prop({ required: true })
  expectedDate: Date;
}
export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);
