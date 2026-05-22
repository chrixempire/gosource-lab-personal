import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AccountType } from '../enum/business.enum';

export type BusinessCustomerDocument = HydratedDocument<BusinessCustomer>;

@Schema({ timestamps: true })
export class BusinessCustomer {
  @Prop({ required: true, unique: true })
  businessName: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ default: AccountType.BUSINESS })
  accountType: string;

  @Prop({ unique: true, lowercase: true, required: true })
  email: string;

  @Prop({ select: false })
  password: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  role: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ default: 0 })
  creditAccount: number;

  @Prop({ default: 3 })
  onboardingStep: number;

  @Prop({ default: false })
  canBuyOnCredit: boolean;

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: [String], default: [] })
  notificationTokens: string[];
}

export const BusinessCustomerSchema =
  SchemaFactory.createForClass(BusinessCustomer);
