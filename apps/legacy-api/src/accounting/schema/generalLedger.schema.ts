// Tracks high-level financial data and links to multiple accounts.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GeneralLedgerDocument = HydratedDocument<GeneralLedger>;

@Schema({ timestamps: true })
export class GeneralLedger {
  @Prop({ required: true })
  accountName: string;

  @Prop({ default: 0 })
  balance: number;
}

export const GeneralLedgerSchema = SchemaFactory.createForClass(GeneralLedger);
