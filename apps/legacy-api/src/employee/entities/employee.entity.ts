import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BusinessCustomer } from '../../business/schema/business.schema';
import * as mongoose from 'mongoose';
import { Branch } from 'src/branch/entities/branch.entity';
import { EmployeeRole } from '../interface/employee.interface';

export type EmployeeDocument = mongoose.HydratedDocument<Employee>;
@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: false })
  firstName: string;

  @Prop({ required: false })
  lastName: string;

  @Prop({ required: false })
  phoneNumber: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false, select: false })
  password: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ required: false })
  position: string;

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

  @Prop({ required: false, default: false })
  isDeactivated: boolean;

  @Prop({ default: 3 })
  onboardingStep: number;

  @Prop()
  notificationToken: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
