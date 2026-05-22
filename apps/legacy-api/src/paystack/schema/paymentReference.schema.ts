import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaymentReferenceDocument = HydratedDocument<PaymentReference>;

@Schema({ timestamps: true })
export class PaymentReference {
  @Prop({ required: true })
  data: string;
}

export const PaymentReferenceSchema =
  SchemaFactory.createForClass(PaymentReference);
