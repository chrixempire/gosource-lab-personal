import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import * as mongoose from 'mongoose';

export type PurchaseOrderCartDocument =
  mongoose.HydratedDocument<PurchaseOrderCart>;

@Schema()
export class PurchaseOrderCart {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Ensure this is correct
  })
  product: mongoose.Types.ObjectId;

  @Prop({
    default: 1,
  })
  quantity: number;

  @Prop({
    default: 0,
  })
  quantityReceived: number;

  @Prop()
  totalPrice: number;
}

export const PurchaseOrderCartSchema =
  SchemaFactory.createForClass(PurchaseOrderCart);
