import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  email: string;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
