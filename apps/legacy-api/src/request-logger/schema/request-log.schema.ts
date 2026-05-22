import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RequestLogDocument = RequestLog & Document;

@Schema({ timestamps: true, collection: 'request_logs' })
export class RequestLog {
  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  path: string;

  @Prop({ type: Object })
  headers: Record<string, any>;

  @Prop({ type: Object })
  query: Record<string, any>;

  @Prop({ type: Object })
  params: Record<string, any>;

  @Prop({ type: Object })
  body: Record<string, any>;

  @Prop()
  ip: string;

  @Prop()
  userAgent: string;

  @Prop()
  origin: string;

  @Prop()
  referer: string;

  @Prop({ required: true })
  statusCode: number;

  @Prop()
  responseTime: number; // in milliseconds

  @Prop({ type: Object })
  responseBody: Record<string, any>;

  @Prop()
  userId?: string;

  @Prop()
  businessId?: string;

  @Prop()
  error?: string;

  @Prop({ type: Object })
  errorDetails?: Record<string, any>;

  @Prop()
  requestSize: number; // in bytes

  @Prop()
  responseSize: number; // in bytes

  @Prop()
  geolocation?: string;

  @Prop()
  timezone?: string;

  @Prop()
  platform?: string;

  @Prop()
  browser?: string;

  @Prop()
  deviceType?: string;

  @Prop({ default: false })
  isSuccess: boolean;

  @Prop()
  endpoint: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const RequestLogSchema = SchemaFactory.createForClass(RequestLog);

// Create indexes for better query performance
RequestLogSchema.index({ createdAt: -1 });
RequestLogSchema.index({ method: 1, path: 1 });
RequestLogSchema.index({ statusCode: 1 });
RequestLogSchema.index({ userId: 1 });
RequestLogSchema.index({ businessId: 1 });
RequestLogSchema.index({ ip: 1 });
RequestLogSchema.index({ isSuccess: 1 });
RequestLogSchema.index({ endpoint: 1 });
