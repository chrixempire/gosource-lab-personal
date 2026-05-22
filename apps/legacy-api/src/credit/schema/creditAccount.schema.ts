import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TimelineEntrySchema, TimelineEntry } from './timeline.schema';
import { ApiProperty } from '@nestjs/swagger';
import { CreditAccountStatusT } from '../enum/credit.enum';
import { BusinessCustomer } from '../../business/schema/business.schema';

export type CreditAccountDocument = HydratedDocument<CreditAccount>;

@Schema({ timestamps: true })
export class CreditAccount {
  @Prop({ type: Types.ObjectId, ref: BusinessCustomer.name, required: true })
  @ApiProperty()
  business: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  @ApiProperty()
  limitKobo: number;

  @Prop({ type: Number, default: 0 })
  @ApiProperty()
  outstandingKobo: number; // total amount owed at any point in time

  @Prop({ type: Number, default: 0 })
  @ApiProperty()
  spendableAmountKobo: number; // remaining approved amount left to spend. does not reduce on payment

  @Prop({ type: Number, default: 0 })
  @ApiProperty()
  availableKobo: number; // limit - outstanding

  @Prop({ type: Number, default: 0 })
  @ApiProperty()
  totalPaymentsKobo: number; // sum of all payments made. even if it's partial payment

  @Prop({ type: Number, default: 0 })
  @ApiProperty()
  totalOverdueKobo: number; // Track overdue amount

  /**
   * Percentage of credit limit currently used.
   * Calculated as (outstandingKobo / limitKobo) * 100.
   */
  @Prop({ type: Number, default: 0 })
  @ApiProperty()
  creditUtilization: number;

  /**
   * Total number of times any repayment for this account has become overdue.
   */
  @Prop({ type: Number, default: 0 })
  @ApiProperty()
  defaultedCounts: number;

  @Prop({ type: Number, default: 0 })
  @ApiProperty()
  creditRequestRejectCounts: number;

  @Prop({
    type: String,
    default: CreditAccountStatusT.ACTIVE,
    enum: CreditAccountStatusT,
  })
  @ApiProperty({ enum: CreditAccountStatusT })
  status: string;

  @Prop({ type: [TimelineEntrySchema], default: [] })
  @ApiProperty({ type: [TimelineEntry] })
  timeline: TimelineEntry[];
}

export const CreditAccountSchema = SchemaFactory.createForClass(CreditAccount);
