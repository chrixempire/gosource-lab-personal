import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BusinessCustomer } from '../../business/schema/business.schema';
import * as mongoose from 'mongoose';

export type PendingTransactionDocument =
  mongoose.HydratedDocument<PendingTransaction>;
@Schema({ timestamps: true })
export class PendingTransaction {
  @Prop({ required: true })
  reference: string;

  @Prop({ default: 0 })
  amount: number;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  customer: BusinessCustomer;
}

export const PendingTransactionSchema =
  SchemaFactory.createForClass(PendingTransaction);
