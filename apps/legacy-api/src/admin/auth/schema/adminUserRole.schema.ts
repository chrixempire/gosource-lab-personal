import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';
import { AdminAccountStatus } from '../enum/admin.enum';

export type AdminUserRoleDocument = HydratedDocument<AdminUserRole>;

@Schema({ timestamps: true })
export class AdminUserRole {
  @Prop()
  adminId: string;

  @Prop()
  roleId: string;

  @Prop({
    type: SchemaTypes.String,
    enum: AdminAccountStatus,
    default: AdminAccountStatus.ACTIVE,
  })
  status: string;
}

export const AdminUserRoleSchema = SchemaFactory.createForClass(AdminUserRole);
