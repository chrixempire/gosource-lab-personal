import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Order } from './order.entity';

export type TimelineDocument = mongoose.HydratedDocument<Timeline>;
@Schema({
  timestamps: true,
})
export class Timeline {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description: string;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Order.name,
  })
  order: Order;
}
export const TimelineSchema = SchemaFactory.createForClass(Timeline);
