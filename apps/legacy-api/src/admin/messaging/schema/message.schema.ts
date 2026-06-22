import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { AdminUser } from '../../auth/schema/adminUser.schema';
import { BusinessCustomer } from '../../../business/schema/business.schema';
import {
  AdminMessageAudience,
  AdminMessageStatus,
  AdminMessageType,
} from '../enum/message.enum';

export type AdminMessageDocument = HydratedDocument<AdminMessage>;

@Schema({ timestamps: true })
export class AdminMessage {
  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ required: true, enum: AdminMessageType, index: true })
  type: AdminMessageType;

  @Prop({ required: true, enum: AdminMessageStatus, index: true })
  status: AdminMessageStatus;

  @Prop({ trim: true })
  subject?: string;

  @Prop({ trim: true })
  theme?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({
    required: true,
    enum: AdminMessageAudience,
    default: AdminMessageAudience.SELECTED,
  })
  audience: AdminMessageAudience;

  @Prop({
    type: [
      { type: mongoose.Schema.Types.ObjectId, ref: BusinessCustomer.name },
    ],
    default: [],
  })
  users: mongoose.Types.ObjectId[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: AdminUser.name,
    required: false,
  })
  createdBy?: mongoose.Types.ObjectId;

  @Prop({ default: 0 })
  recipientCount: number;

  @Prop({ default: 0 })
  deliveredCount: number;

  @Prop({ default: 0 })
  failedCount: number;

  @Prop({ default: 0 })
  resendCount: number;

  @Prop()
  lastSentAt?: Date;
}

export const AdminMessageSchema = SchemaFactory.createForClass(AdminMessage);

AdminMessageSchema.index({ createdAt: -1 });
AdminMessageSchema.index({ type: 1, status: 1, createdAt: -1 });
