import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WebhookDocument = HydratedDocument<Webhook>;

@Schema({ timestamps: true })
export class Webhook {
  @Prop({ required: true })
  data: string;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);
