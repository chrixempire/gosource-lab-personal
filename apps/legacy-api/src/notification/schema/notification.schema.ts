import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, SchemaTypes } from 'mongoose';
import {
  NOTIFICATION_RECIPIENT_TYPE,
  NOTIFICATION_TYPE,
} from '../interface/notification.interface';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  /** Recipient user id: a BusinessCustomer _id (BUSINESS) or an Employee _id (EMPLOYEE). */
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  readonly recipient: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(NOTIFICATION_RECIPIENT_TYPE) })
  readonly recipientType: NOTIFICATION_RECIPIENT_TYPE;

  /** Owning business (tenant) — scopes list queries. */
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  readonly businessId: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(NOTIFICATION_TYPE) })
  readonly type: NOTIFICATION_TYPE;

  @Prop({ required: true })
  readonly title: string;

  @Prop({ required: true })
  readonly message: string;

  /** In-app deep link the bell row navigates to. */
  @Prop({ required: false })
  readonly link?: string;

  @Prop({ required: true, default: false })
  read: boolean;

  @Prop({ required: false, type: Date })
  readAt?: Date;

  @Prop({ required: false, type: mongoose.Schema.Types.Mixed })
  readonly metadata?: Record<string, unknown>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Bell list: newest-first per recipient; unread-count uses the same prefix.
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1 });
