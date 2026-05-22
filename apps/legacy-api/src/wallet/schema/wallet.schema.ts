import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BusinessCustomer } from '../../business/schema/business.schema';
import * as mongoose from 'mongoose';
import { LedgerAccount } from '../../accounting/schema/accountLedger.schema';

export type WalletDocument = mongoose.HydratedDocument<Wallet>;
@Schema({ timestamps: true })
export class Wallet {
  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 0 })
  creditBalance: number;

  @Prop({ required: true })
  bvn: string;

  @Prop({ required: true })
  accountName: string;

  @Prop({ required: true })
  accountNumber: string;

  @Prop({ required: true })
  bankCode: string;

  @Prop({ required: true })
  bankName: string;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  customer: BusinessCustomer;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: LedgerAccount.name,
  })
  account: LedgerAccount;

  @Prop({ default: true })
  active: boolean;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
