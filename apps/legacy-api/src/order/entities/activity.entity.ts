import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Order } from './order.entity';

export type OrderActivityLogDocument = HydratedDocument<OrderActivityLog>;

@Schema({ timestamps: true })
export class OrderActivityLog {
  @Prop({ required: true })
  description: string;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Order.name,
  })
  order: Order;

  @Prop({ required: true })
  initiator: string;
}

export const OrderActivityLogSchema =
  SchemaFactory.createForClass(OrderActivityLog);
