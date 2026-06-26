import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../../business/schema/business.schema';
import * as mongoose from 'mongoose';
import { Branch, BranchDocument } from '../../branch/entities/branch.entity';
import {
  Product,
  ProductDocument,
  ProductSchema,
} from '../../product/entities/product.entity';
import { ORDER_STATUS } from '../../order/interface/order.interface';

export type CartDocument = mongoose.HydratedDocument<Cart>;

@Schema({ timestamps: true })
export class Cart {
  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  business: BusinessCustomerDocument;

  @Prop({
    unique: false,
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: Branch.name,
  })
  branch: BranchDocument;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Product.name,
  })
  product: ProductDocument;

  @Prop()
  quantity: number;

  @Prop()
  unit: string;

  @Prop()
  totalPrice: number;

  @Prop({ required: false })
  financialSnapshotVersion: number;

  @Prop({ required: false })
  unitSellingPrice: number;

  @Prop({ required: false })
  grossLineRevenue: number;

  @Prop({ required: false })
  allocatedDiscount: number;

  @Prop({ required: false })
  netLineRevenue: number;

  @Prop({ required: false })
  baseUnitCost: number;

  @Prop({ required: false })
  baseQuantityPerSellingUnit: number;

  @Prop({ required: false })
  totalBaseQuantity: number;

  @Prop({ required: false })
  totalCost: number;

  @Prop({ required: false })
  grossProfit: number;

  @Prop({ required: false, type: ProductSchema })
  cartProduct: ProductDocument;

  @Prop({
    required: false,
    enum: ORDER_STATUS,
    default: ORDER_STATUS.PENDING,
  })
  status: ORDER_STATUS; // for partial order delivery (admin-level)

  @Prop({ required: false })
  deliveredAt: Date;

  @Prop({ required: false })
  lastAbandonedNotificationSentAt: Date;

  @Prop({ required: false })
  abandonedNotificationCount: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
