// Tracks manual adjustments.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { LedgerAccount } from './accountLedger.schema';
import { TransactionType } from '../enum/accounting.enum';

export type AdjustmentLedgerDocument = HydratedDocument<AdjustmentLedger>;

@Schema({ timestamps: true })
export class AdjustmentLedger {
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
  adjustmentAccount: LedgerAccount;

  @Prop({ enum: TransactionType })
  type: string;
}

export const AdjustmentLedgerSchema =
  SchemaFactory.createForClass(AdjustmentLedger);
