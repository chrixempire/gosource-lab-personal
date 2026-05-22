import { ApiProperty } from '@nestjs/swagger';
import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { BusinessCustomer } from '../../business/schema/business.schema';
import { CreditAccount } from './creditAccount.schema';
import { PaymentMethod, PaymentRefStatus } from '../enum/repayment.enum';
import { AdminUser } from '../../admin/auth/schema/adminUser.schema';

export type CreditPaymentReferenceDocument =
  HydratedDocument<CreditPaymentReference>;

@Schema({ timestamps: true })
export class CreditPaymentReference {
  @Prop({ required: true, unique: true })
  @ApiProperty()
  referenceCode: string;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: CreditAccount.name,
    required: true,
  })
  @ApiProperty({ type: () => CreditAccount })
  creditAccount: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: BusinessCustomer.name,
    required: true,
  })
  @ApiProperty({ type: () => BusinessCustomer })
  business: mongoose.Types.ObjectId;

  @Prop({ required: true, type: Number })
  @ApiProperty()
  amountKobo: number;

  @Prop({ required: true, enum: PaymentMethod })
  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({
    required: true,
    enum: PaymentRefStatus,
    default: PaymentRefStatus.PENDING,
  })
  @ApiProperty({ enum: PaymentRefStatus })
  status: PaymentRefStatus;

  @Prop({ required: false })
  @ApiProperty()
  paymentNote: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: AdminUser.name })
  @ApiProperty({ type: () => AdminUser })
  approvedBy: mongoose.Types.ObjectId;

  @Prop({ type: Date })
  @ApiProperty()
  approvedAt: Date;

  @Prop({ type: Number })
  @ApiProperty()
  actualAmountKobo: number; // For cases where paid amount differs from requested

  @Prop({ type: Object, default: {} })
  @ApiProperty()
  metadata: Record<string, any>;
}

export const CreditPaymentReferenceSchema = SchemaFactory.createForClass(
  CreditPaymentReference,
);
