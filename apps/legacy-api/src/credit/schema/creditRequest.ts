import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../../business/schema/business.schema';
import * as mongoose from 'mongoose';
import { CreditRequestTypeT, CreditStatus } from '../enum/credit.enum';
import { RepaymentFrequency } from '../enum/repayment.enum';
import { ApiProperty } from '@nestjs/swagger';
import { TimelineEntry, TimelineEntrySchema } from './timeline.schema';
import { CreditAccount, CreditAccountDocument } from './creditAccount.schema';

export type CreditRequestDocument = mongoose.HydratedDocument<CreditRequest>;

@Schema({ timestamps: true })
export class CreditRequest {
  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  @ApiProperty({ type: () => BusinessCustomer })
  business: BusinessCustomerDocument;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: CreditAccount.name,
    required: true,
  })
  @ApiProperty({ type: () => CreditAccount })
  creditAccount: CreditAccountDocument;

  @Prop({ required: false, type: Number, default: 0 })
  @ApiProperty()
  requestedAmountKobo: number;

  @Prop({ required: false, default: 0 })
  @ApiProperty()
  approvedAmountKobo: number;

  @Prop({ required: true, enum: CreditStatus, default: CreditStatus.PENDING })
  @ApiProperty({ enum: CreditStatus })
  status: string;

  @Prop({ required: false })
  @ApiProperty()
  rejectionReason: string;

  @Prop({ required: false, default: 1 })
  @ApiProperty()
  applicationLevel: number;

  @Prop({ required: false })
  @ApiProperty()
  interestKobo: number;

  @Prop({ required: false })
  @ApiProperty()
  approvedDate: Date;

  @Prop({ required: false })
  @ApiProperty()
  dueDate: Date;

  @Prop({ required: false })
  @ApiProperty()
  duration: number;

  @Prop({
    required: false,
    enum: [RepaymentFrequency.WEEKLY, RepaymentFrequency.MONTHLY],
  })
  @ApiProperty()
  requestedRepaymentFrequency: string;

  @Prop({ required: false })
  @ApiProperty()
  requestedRepaymentDuration: number;

  // New repayment-related fields
  @Prop({
    required: false,
    enum: Object.values(RepaymentFrequency),
  })
  @ApiProperty({ enum: Object.values(RepaymentFrequency) })
  repaymentFrequency: RepaymentFrequency;

  @Prop({ required: false })
  @ApiProperty()
  repaymentDuration: number; // Number of installments

  @Prop({ required: false })
  @ApiProperty()
  customFrequencyDays: number; // Only used when frequency is CUSTOM

  @Prop({ required: false, type: Number })
  @ApiProperty()
  interestRate: number; // Interest rate as percentage

  @Prop({ required: false, type: Number, default: 0 })
  @ApiProperty()
  gracePeriodDays: number; // Grace period in days

  @Prop({ required: false, type: Number, default: 0 })
  @ApiProperty()
  overdueChargeRate: number; // Overdue charges as percentage

  @Prop({ required: false })
  @ApiProperty()
  firstPaymentDate: Date;

  @Prop({ required: false })
  @ApiProperty()
  finalPaymentDate: Date; // Date of the last scheduled payment. Expected final payment date

  @Prop({ required: false })
  @ApiProperty()
  completionPaymentDate: Date; // Date when loan was fully repaid

  @Prop({ required: false, type: Number, default: 0 })
  @ApiProperty()
  totalInterestAmountKobo: number;

  @Prop({ required: false, type: Number, default: 0 })
  @ApiProperty()
  totalRepaymentAmountKobo: number;

  @Prop({ required: false, default: false })
  @ApiProperty()
  isRepaymentScheduleGenerated: boolean;

  @Prop({ required: true, type: [TimelineEntrySchema], default: [] })
  @ApiProperty({ type: [TimelineEntry] })
  timeline: TimelineEntry[];

  @Prop({
    required: true,
    enum: CreditRequestTypeT,
    default: CreditRequestTypeT.INITIAL,
  })
  @ApiProperty({ enum: CreditRequestTypeT })
  requestType: string;

  @Prop({ required: false, type: CreditAccount })
  @ApiProperty({ type: () => CreditAccount })
  currentCreditAccount: CreditAccount;
}

export const CreditRequestSchema = SchemaFactory.createForClass(CreditRequest);
