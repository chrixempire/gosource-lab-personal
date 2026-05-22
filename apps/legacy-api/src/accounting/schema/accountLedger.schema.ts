// Represents individual user or system accounts, each linked to the General Ledger.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { GeneralLedger } from './generalLedger.schema';

export type LedgerAccountDocument = HydratedDocument<LedgerAccount>;

@Schema({ timestamps: true })
export class LedgerAccount {
  @Prop({ required: true })
  accountName: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: GeneralLedger.name,
  })
  ledger: GeneralLedger;
}

export const LedgerAccountSchema = SchemaFactory.createForClass(LedgerAccount);
