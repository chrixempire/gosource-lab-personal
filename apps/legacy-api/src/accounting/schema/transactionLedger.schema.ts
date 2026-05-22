// Logs every individual transaction, linking debit and credit accounts.\

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { LedgerAccount } from './accountLedger.schema';

export type TransactionLedgerDocument = HydratedDocument<TransactionLedger>;

@Schema({ timestamps: true })
export class TransactionLedger {
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
  debitAccount: LedgerAccount;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: LedgerAccount.name,
  })
  creditAccount: LedgerAccount;
}

export const TransactionLedgerSchema =
  SchemaFactory.createForClass(TransactionLedger);
