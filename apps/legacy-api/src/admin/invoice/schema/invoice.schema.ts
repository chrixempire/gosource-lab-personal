import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { InvoiceStatus } from '../enum/invoice.enum';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true })
  reference: string;

  @Prop({ required: true })
  orderId: string;

  @Prop({ type: [String], required: true })
  products: string[];

  @Prop({
    type: SchemaTypes.String,
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING,
  })
  status: string;

  @Prop({ required: false })
  businessId: string;

  @Prop({ required: false })
  paymentUrl: string;

  @Prop({ required: false })
  paymentReference: string;

  @Prop()
  totalAmount: number;

  @Prop({ type: Types.ObjectId, required: false })
  createdBy: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
