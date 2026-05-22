import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { Cart } from '../../cart/entities/cart.entity';
import { PaymentStatus, RequestStatus } from '../enum/request.enum';
import { Branch, BranchDocument } from '../../branch/entities/branch.entity';
import {
  Employee,
  EmployeeDocument,
} from '../../employee/entities/employee.entity';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../../business/schema/business.schema';
import { ProductDocument } from '../../product/entities/product.entity';
import {
  Coupon,
  CouponDocument,
} from '../../admin/coupon/schema/coupon.schema';

@Schema()
export class Address {
  @Prop()
  streetAddress: string;
  @Prop()
  directions: string;
  @Prop()
  state: string;
  @Prop()
  lga: string;
}

const addressSchema = SchemaFactory.createForClass(Address);

export type RequestDocument = HydratedDocument<Request>;

@Schema({ timestamps: true })
export class Request {
  @Prop({ required: true })
  products: Cart[];

  @Prop({
    unique: false,
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: Branch.name,
  })
  branch: BranchDocument;

  @Prop({
    required: false,
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: string;

  @Prop({ required: true })
  reference: string;

  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Employee.name,
  })
  initiator: EmployeeDocument;

  @Prop({
    unique: false,
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  approver: BusinessCustomerDocument;

  @Prop({
    unique: false,
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  rejectedBy: BusinessCustomerDocument;

  @Prop({ required: false })
  rejectedReasons: string;

  @Prop({ required: true, type: addressSchema })
  address: Address;

  @Prop({ required: false })
  paymentMethod: string;

  @Prop({
    required: false,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: string;

  @Prop({ required: false })
  phoneNumber: string;

  @Prop({ required: false, default: false })
  coupon: boolean;

  @Prop({ required: false, default: false })
  couponCode: string;

  @Prop({ required: false, default: 0 })
  deliveryFee: number;

  @Prop({ required: false, default: 0 })
  serviceCharge: number;

  @Prop({ required: false })
  requestProducts: ProductDocument[];

  @Prop({ required: false, default: 0 })
  subtotal: number;

  @Prop({ required: false, default: 0 })
  discount: number;

  @Prop({
    unique: false,
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: Coupon.name,
  })
  couponDetails: CouponDocument;
}

export const RequestSchema = SchemaFactory.createForClass(Request);
