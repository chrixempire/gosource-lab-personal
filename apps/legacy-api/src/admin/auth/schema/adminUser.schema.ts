import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, SchemaTypes } from 'mongoose';
import { Role } from '../../role/entities/role.entity';
import { AdminAccountStatus } from '../enum/admin.enum';

export type AdminUserDocument = HydratedDocument<AdminUser>;

@Schema({ timestamps: true })
export class AdminUser {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ unique: true, lowercase: true, required: true })
  email: string;

  @Prop({ select: false })
  password: string;

  @Prop()
  phoneNumber: string;

  @Prop({
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: Role.name,
  })
  roleId: string;

  @Prop({
    type: SchemaTypes.String,
    enum: AdminAccountStatus,
    default: AdminAccountStatus.INACTIVE,
  })
  status: string;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
