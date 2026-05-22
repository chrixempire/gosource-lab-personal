import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { AdminUser } from '../../auth/schema/adminUser.schema';
import { Product } from '../../../product/entities/product.entity';

export type StockCountDocument = HydratedDocument<StockCount>;

@Schema({ timestamps: true })
export class StockCount {
  @Prop({ required: false, trim: true })
  notes: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: AdminUser.name,
    required: true,
  })
  initiator: mongoose.Types.ObjectId;

  @Prop([
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Product.name,
        required: false,
      },
      originalQuantity: { type: Number, required: true },
      countedQuantity: { type: Number, required: true },
      unit: { type: String, required: false },
      price: { type: Number, required: false },
    },
  ])
  countedProducts: Array<{
    productId: mongoose.Schema.Types.ObjectId;
    originalQuantity: number;
    countedQuantity: number;
    unit: string;
    price: number;
  }>;
}

export const StockCountSchema = SchemaFactory.createForClass(StockCount);
