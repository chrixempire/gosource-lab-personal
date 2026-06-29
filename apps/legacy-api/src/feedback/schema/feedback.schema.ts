import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { BusinessCustomer } from '../../business/schema/business.schema';
import { FeedbackCategory, FeedbackStatus } from '../feedback.enum';

export type FeedbackDocument = mongoose.HydratedDocument<Feedback>;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ enum: FeedbackCategory, default: FeedbackCategory.GENERAL })
  category: string;

  @Prop({ min: 1, max: 5 })
  rating?: number;

  /** App route the feedback was submitted from (for context). */
  @Prop()
  page?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: BusinessCustomer.name })
  business?: mongoose.Types.ObjectId;

  /** Snapshot of who submitted, captured at submit time for display. */
  @Prop()
  businessName?: string;

  @Prop()
  email?: string;

  @Prop({ enum: FeedbackStatus, default: FeedbackStatus.NEW, index: true })
  status: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
FeedbackSchema.index({ createdAt: -1 });
