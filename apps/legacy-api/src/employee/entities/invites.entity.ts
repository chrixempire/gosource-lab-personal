import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BusinessCustomer } from '../../business/schema/business.schema';
import * as mongoose from 'mongoose';
import { EmployeeRole } from '../interface/employee.interface';
import { Branch } from 'src/branch/entities/branch.entity';
import { EmployeeInviteStatus } from '../enum/employee.enum';

export type EmployeeInviteDocument = mongoose.HydratedDocument<EmployeeInvite>;
@Schema({ timestamps: true })
export class EmployeeInvite {
  @Prop({ required: true })
  email: string;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  businessId: BusinessCustomer;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Branch.name,
  })
  branchId: Branch;

  @Prop({
    required: false,
    enum: EmployeeRole,
    default: EmployeeRole.MANAGER,
  })
  role: string;

  @Prop({
    required: false,
    enum: EmployeeInviteStatus,
    default: EmployeeInviteStatus.PENDING,
  })
  status: string;
}

export const EmployeeInviteSchema =
  SchemaFactory.createForClass(EmployeeInvite);
