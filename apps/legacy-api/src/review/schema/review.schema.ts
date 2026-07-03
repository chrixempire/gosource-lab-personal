import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { BusinessCustomer } from '../../business/schema/business.schema';
import { Order } from '../../order/entities/order.entity';

export type ReviewDocument = mongoose.HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  /** The order being rated (checkout experience). */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Order.name, index: true })
  order?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: BusinessCustomer.name })
  business?: mongoose.Types.ObjectId;

  /** Snapshot of who submitted, for display in admin. */
  @Prop()
  businessName?: string;

  @Prop()
  email?: string;

  /** Customer Effort Score, 1 (hard) – 5 (very easy). */
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true })
  comment?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ createdAt: -1 });
// One review per order per business.
ReviewSchema.index({ order: 1, business: 1 }, { unique: true, sparse: true });
