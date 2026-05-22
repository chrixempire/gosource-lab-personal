import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { CreditRequest } from './creditRequest';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../../business/schema/business.schema';
import { RepaymentStatus, PaymentMethod } from '../enum/repayment.enum';
import { ApiProperty } from '@nestjs/swagger';
import { CreditAccount } from './creditAccount.schema';

export type RepaymentScheduleDocument =
  mongoose.HydratedDocument<RepaymentSchedule>;

@Schema({ timestamps: true })
export class RepaymentSchedule {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: CreditRequest.name,
  })
  @ApiProperty()
  creditRequest: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: CreditAccount.name,
    required: true,
  })
  creditAccount: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  @ApiProperty()
  business: BusinessCustomerDocument;

  @Prop({ required: true })
  @ApiProperty()
  installmentNumber: number;

  @Prop({ required: true, type: Number })
  @ApiProperty()
  principalAmountKobo: number;

  @Prop({ required: true, type: Number })
  @ApiProperty()
  interestAmountKobo: number;

  @Prop({ required: false, type: Number, default: 0 })
  @ApiProperty()
  overdueChargesKobo: number;

  @Prop({ required: false, type: Number, default: 0 })
  @ApiProperty()
  lateFeesKobo: number;

  @Prop({ required: true, type: Number })
  @ApiProperty()
  totalAmountKobo: number;

  @Prop({ required: false, type: Number, default: 0 })
  @ApiProperty()
  paidAmountKobo: number;

  @Prop({ required: false, type: Number, default: 0 })
  @ApiProperty()
  remainingAmountKobo: number;

  @Prop({ required: true })
  @ApiProperty()
  dueDate: Date;

  @Prop({ required: false })
  @ApiProperty()
  paidDate: Date;

  @Prop({
    required: true,
    enum: Object.values(RepaymentStatus),
    default: RepaymentStatus.PENDING,
  })
  @ApiProperty({ enum: Object.values(RepaymentStatus) })
  status: RepaymentStatus;

  @Prop({
    required: false,
    enum: Object.values(PaymentMethod),
  })
  @ApiProperty({ enum: Object.values(PaymentMethod) })
  paymentMethod: PaymentMethod;

  @Prop({ required: false })
  @ApiProperty()
  transactionReference: string;

  @Prop({ required: false })
  @ApiProperty()
  paymentNote: string;

  @Prop({ required: false })
  @ApiProperty()
  gracePeriodEnd: Date;

  @Prop({ required: false, default: false })
  @ApiProperty()
  isOverdue: boolean;

  @Prop({ required: false, default: 0 })
  @ApiProperty()
  daysOverdue: number;
}

export const RepaymentScheduleSchema =
  SchemaFactory.createForClass(RepaymentSchedule);

// Add indexes for better query performance
RepaymentScheduleSchema.index({ creditRequest: 1, installmentNumber: 1 });
RepaymentScheduleSchema.index({ business: 1, dueDate: 1 });
RepaymentScheduleSchema.index({ status: 1 });
RepaymentScheduleSchema.index({ dueDate: 1, status: 1 });
