import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BusinessCustomer } from 'src/business/schema/business.schema';
import { Branch } from '../../branch/entities/branch.entity';
import {
  ORDER_PAYMENT_STATUS,
  ORDER_STATUS,
} from '../interface/order.interface';
import { Cart } from '../../cart/entities/cart.entity';
import { Request, RequestDocument } from '../../request/schema/request.schema';

@Schema()
export class Address {
  @Prop()
  streetAddress: string;
  @Prop()
  directions: string;
  @Prop()
  state: string;
  @Prop()
  lga: string;
}

const addressSchema = SchemaFactory.createForClass(Address);

export type OrderDocument = mongoose.HydratedDocument<Order>;
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Order {
  @Prop({ required: true })
  products: Cart[];

  @Prop({ required: false })
  additionalProducts: Cart[];

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true, type: addressSchema })
  address: Address;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({ default: null })
  cancellationReason: string;

  @Prop({ required: false, default: 0 })
  deliveryFee: number;

  @Prop({ required: false, default: 0 })
  serviceCharge: number;

  @Prop({ required: false, default: 0 })
  discount: number;

  @Prop({
    required: false,
    enum: ORDER_PAYMENT_STATUS,
    default: ORDER_PAYMENT_STATUS.PENDING,
  })
  paymentStatus: ORDER_PAYMENT_STATUS;

  @Prop({ required: false, default: false })
  coupon: boolean;

  @Prop({ required: true })
  reference: string;

  @Prop({
    required: false,
    enum: ORDER_STATUS,
    default: ORDER_STATUS.PENDING,
  })
  status: ORDER_STATUS;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Request.name,
  })
  request: RequestDocument;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  business: BusinessCustomer;

  @Prop({
    unique: false,
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  customerId: BusinessCustomer;

  @Prop({
    unique: false,
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: Branch.name,
  })
  branch: Branch;

  @Prop({ required: false })
  shippedAt: Date;

  @Prop({ required: false })
  deliveredAt: Date;

  @Prop({ required: false })
  cancelledAt: Date;

  @Prop({ required: false })
  paidAt: Date;

  @Prop({ required: false, default: 0 })
  totalPrice: number;

  @Prop({ required: false, default: 0 })
  additionalTotalPrice: number;

  @Prop({ required: false, default: 0 })
  paymentCount: number; // This is used to track the number of payments made for the order
}
export const OrderSchema = SchemaFactory.createForClass(Order);
