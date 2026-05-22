import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminOtpDocument = HydratedDocument<AdminOtp>;

@Schema({ timestamps: true })
export class AdminOtp {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  email: string;
}

export const AdminOtpSchema = SchemaFactory.createForClass(AdminOtp);
