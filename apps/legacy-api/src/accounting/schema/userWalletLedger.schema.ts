// Tracks user-specific transactions.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { LedgerAccount } from './accountLedger.schema';
import { TransactionType } from '../enum/accounting.enum';

export type UserWalletLedgerDocument = HydratedDocument<UserWalletLedger>;

@Schema({ timestamps: true })
export class UserWalletLedger {
  @Prop({ default: 0 })
  amount: number;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: LedgerAccount.name,
  })
  account: LedgerAccount;

  @Prop({ required: true })
  description: string;

  @Prop({ enum: TransactionType })
  type: string;
}

export const UserWalletLedgerSchema =
  SchemaFactory.createForClass(UserWalletLedger);
