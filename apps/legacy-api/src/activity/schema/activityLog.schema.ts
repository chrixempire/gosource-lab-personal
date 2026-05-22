import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, SchemaTypes } from 'mongoose';
import {
  ACTIVITY_LOG_ACTION_TYPE,
  INITIATOR_TYPE,
} from '../interface/activityLog.interface';

export type ActivityLogDocument = HydratedDocument<ActivityLog>;

@Schema({ timestamps: true })
export class ActivityLog {
  @Prop({ required: true })
  readonly description: string;

  @Prop({
    type: SchemaTypes.ObjectId,
  })
  readonly objectId: mongoose.Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
  })
  readonly initiator: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(INITIATOR_TYPE),
  })
  readonly initiatorType: INITIATOR_TYPE;

  // Optional: The module or feature where the action occurred (e.g., 'Orders', 'Payments')
  @Prop({ required: false })
  readonly module?: string;

  @Prop({
    required: false,
    enum: ACTIVITY_LOG_ACTION_TYPE,
  })
  readonly action?: ACTIVITY_LOG_ACTION_TYPE;

  @Prop({ required: false })
  readonly ipAddress?: string;

  @Prop({ required: false, type: mongoose.Schema.Types.Mixed })
  readonly metadata?: Record<string, any>;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
