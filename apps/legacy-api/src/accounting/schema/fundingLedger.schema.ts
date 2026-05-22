// Tracks all funding transactions.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { LedgerAccount } from './accountLedger.schema';
import { TransactionType } from '../enum/accounting.enum';

export type FundingLedgerDocument = HydratedDocument<FundingLedger>;

@Schema({ timestamps: true })
export class FundingLedger {
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
  fundingAccount: LedgerAccount;

  @Prop({ enum: TransactionType })
  type: string;
}

export const FundingLedgerSchema = SchemaFactory.createForClass(FundingLedger);
