import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as mongoose from 'mongoose';
import { BusinessCustomer } from '../../business/schema/business.schema';
import { Branch } from '../../branch/entities/branch.entity';
import { Product } from '../../product/entities/product.entity';
import { ORDER_STATUS } from '../../order/interface/order.interface';

@Schema({ _id: true })
export class Item {
  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Product.name,
  })
  @ApiProperty()
  product: mongoose.Types.ObjectId;

  @Prop()
  @ApiProperty()
  quantity: number;

  @Prop()
  @ApiProperty()
  unit: string;

  @Prop({
    required: false,
    enum: ORDER_STATUS,
    default: ORDER_STATUS.PENDING,
  })
  status: ORDER_STATUS;

  @Prop({ required: false })
  deliveredAt: Date;

  _id?: mongoose.Types.ObjectId;
}
export const ItemSchema = SchemaFactory.createForClass(Item);

@Schema({ timestamps: true })
export class ShoppingList {
  @Prop({
    unique: false,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: BusinessCustomer.name,
  })
  @ApiProperty()
  businessId: mongoose.Types.ObjectId;

  @Prop({
    unique: false,
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: Branch.name,
  })
  @ApiProperty()
  branchId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  @ApiProperty()
  name: string;

  @Prop()
  @ApiProperty()
  description: string;

  @Prop({ type: [ItemSchema], default: [] })
  @ApiProperty({ type: [Item] })
  items: Item[];
}

export type ShoppingListDocument = mongoose.HydratedDocument<ShoppingList>;
export const ShoppingListSchema = SchemaFactory.createForClass(ShoppingList);
