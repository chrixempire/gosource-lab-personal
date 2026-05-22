import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminRoleDocument = HydratedDocument<AdminRole>;

@Schema({ timestamps: true })
export class AdminRole {
  @Prop()
  name: string;
}

export const AdminRoleSchema = SchemaFactory.createForClass(AdminRole);
