// Tracks all credit transactions (refunds, promotions).

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { LedgerAccount } from './accountLedger.schema';
import { TransactionType } from '../enum/accounting.enum';

export type CreditLedgerDocument = HydratedDocument<CreditLedger>;

@Schema({ timestamps: true })
export class CreditLedger {
  @Prop({ default: 0 })
  amount: number;

  @Prop({ required: true })
  description: string;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: LedgerAccount.name,
  })
  creditAccount: LedgerAccount;

  @Prop({ enum: TransactionType })
  type: string;
}

export const CreditLedgerSchema = SchemaFactory.createForClass(CreditLedger);
