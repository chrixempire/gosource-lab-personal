import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaymentTransactionReferenceDocument =
  HydratedDocument<PaymentTransactionReference>;

@Schema({ timestamps: true })
export class PaymentTransactionReference {
  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ required: false })
  channel: string;

  @Prop({ required: false, default: false })
  processed: boolean;
}

export const PaymentTransactionReferenceSchema = SchemaFactory.createForClass(
  PaymentTransactionReference,
);
