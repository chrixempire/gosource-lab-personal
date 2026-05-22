import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BusinessCustomer } from '../../business/schema/business.schema';
import * as mongoose from 'mongoose';
import { TransactionType } from '../../accounting/enum/accounting.enum';
import { TransactionStatus } from '../enum/wallet.enum';

export type WalletTransactionDocument =
  mongoose.HydratedDocument<WalletTransaction>;

@Schema({ timestamps: true })
export class WalletTransaction {
  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ default: 0 })
  amount: number;

  @Prop({ required: true, enum: TransactionType })
  type: string;

  @Prop({
    required: true,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: string;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  business: BusinessCustomer;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, unique: true })
  paymentReference: string;
}

export const WalletTransactionSchema =
  SchemaFactory.createForClass(WalletTransaction);
