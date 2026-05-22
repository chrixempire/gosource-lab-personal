import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Product, ProductDocument } from './product.entity';
import { Branch, BranchDocument } from '../../branch/entities/branch.entity';

@Schema({ timestamps: true })
export class InventoryMovement {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Product.name,
  })
  product: ProductDocument;

  @Prop({
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: Branch.name,
  })
  branch: BranchDocument;

  @Prop({ required: true })
  movementType: string; // 'ADDITION', 'DEDUCTION', 'SALE', 'TRANSFER_IN', etc.

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true })
  reference: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false })
  relatedDocumentId: string;

  @Prop({ required: true })
  movementDate: Date;

  @Prop({ required: true })
  runningBalance: number; // Quantity after this movement
}

export const InventoryMovementSchema =
  SchemaFactory.createForClass(InventoryMovement);
