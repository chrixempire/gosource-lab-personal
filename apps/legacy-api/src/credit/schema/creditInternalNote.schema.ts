import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Credit } from './credit.schema';
import { AdminUser } from '../../admin/auth/schema/adminUser.schema';
import {
  NotePriority,
  InternalNoteType,
} from '../enum/creditInternalNote.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreditRequest } from './creditRequest';

export type CreditInternalNoteDocument =
  mongoose.HydratedDocument<CreditInternalNote>;

@Schema({ timestamps: true })
export class CreditInternalNote {
  @Prop({
    required: true,
    enum: Object.values(InternalNoteType),
    default: InternalNoteType.APPLICATION,
  })
  @ApiProperty({ enum: Object.values(InternalNoteType) })
  noteType: string;

  @Prop({
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: Credit.name,
  })
  @ApiPropertyOptional()
  creditApplication: mongoose.Types.ObjectId;

  @Prop({
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: CreditRequest.name,
  })
  @ApiPropertyOptional()
  creditRequest: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: AdminUser.name,
  })
  @ApiProperty()
  createdBy: mongoose.Types.ObjectId;

  @Prop({ required: true, trim: true })
  @ApiProperty()
  note: string;

  @Prop({ required: false, trim: true })
  @ApiProperty()
  category: string;

  @Prop({
    required: false,
    enum: Object.values(NotePriority),
    default: NotePriority.MEDIUM,
  })
  @ApiProperty({ enum: Object.values(NotePriority) })
  priority: string;

  @Prop({ required: false, default: false })
  @ApiProperty()
  isPrivate: boolean;

  @Prop({ required: false })
  @ApiProperty({ type: () => [String] })
  attachments: string[];

  @Prop({ required: false })
  @ApiProperty()
  tags: string[];
}

export const CreditInternalNoteSchema =
  SchemaFactory.createForClass(CreditInternalNote);

// Add indexes for better query performance
CreditInternalNoteSchema.index({
  creditApplication: 1,
  noteType: 1,
  createdAt: -1,
});
CreditInternalNoteSchema.index({
  creditRequest: 1,
  noteType: 1,
  createdAt: -1,
});
CreditInternalNoteSchema.index({ createdBy: 1 });
CreditInternalNoteSchema.index({ category: 1 });
CreditInternalNoteSchema.index({ priority: 1 });
CreditInternalNoteSchema.index({ noteType: 1 });
