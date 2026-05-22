import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../../business/schema/business.schema';
import * as mongoose from 'mongoose';
import { CreditApplicationTypeT, CreditStatus } from '../enum/credit.enum';
import { ApiProperty } from '@nestjs/swagger';
import { AdditionalDocDto } from '../dto/creditDocumentChecklist.dto';
import { TimelineEntrySchema, TimelineEntry } from './timeline.schema';
import { CreditAccount } from './creditAccount.schema';

export type CreditDocument = mongoose.HydratedDocument<Credit>;
// THIS IS A CREDIT APPLICATION. NOT THE CREDIT ACCOUNT
@Schema({ timestamps: true })
export class Credit {
  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  @ApiProperty({ type: () => BusinessCustomer })
  business: BusinessCustomerDocument;

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

  @Prop({ required: false, default: '' })
  @ApiProperty()
  tin: string;

  @Prop({ required: false, default: '' })
  @ApiProperty()
  cacRegistrationNumber: string;

  @Prop({ required: false, default: '' })
  @ApiProperty()
  bankStatement: string;

  @Prop({ required: false, default: '' })
  @ApiProperty()
  bvn: string;

  @Prop({ required: false, default: '' })
  @ApiProperty()
  revenueRange: string;

  @Prop({ required: false, default: '' })
  @ApiProperty()
  yearOfOperations: string;

  @Prop({ required: false, default: '' })
  @ApiProperty()
  identity: string;

  @Prop({ required: false, default: '' })
  @ApiProperty()
  identityType: string;

  @Prop({ required: false })
  @ApiProperty()
  approvedDate: Date;

  @Prop({
    type: [
      {
        key: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    default: [],
  })
  @ApiProperty({
    type: [AdditionalDocDto],
  })
  additionalDocs: Array<AdditionalDocDto>;

  @Prop({ required: true, type: [TimelineEntrySchema], default: [] })
  @ApiProperty({ type: [TimelineEntry] })
  timeline: TimelineEntry[];

  @Prop({
    required: true,
    enum: CreditApplicationTypeT,
    default: CreditApplicationTypeT.INITIAL,
  })
  @ApiProperty({ enum: CreditApplicationTypeT })
  applicationType: string;

  @Prop({ required: false, type: CreditAccount })
  @ApiProperty({ type: () => CreditAccount })
  currentCreditAccount: CreditAccount;
}

export const CreditSchema = SchemaFactory.createForClass(Credit);
