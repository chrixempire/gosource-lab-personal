import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { AdminUser } from '../../admin/auth/schema/adminUser.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class CreditDocumentChecklistItem {
  @Prop({ required: true })
  @ApiProperty()
  name: string;

  @Prop({ default: true })
  @ApiProperty()
  verified: boolean;

  @Prop()
  @ApiPropertyOptional()
  verifiedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: AdminUser.name })
  @ApiPropertyOptional()
  verifiedBy?: string;

  @Prop({ default: true })
  @ApiProperty()
  required: boolean;
}

export const CreditDocumentChecklistItemSchema = SchemaFactory.createForClass(
  CreditDocumentChecklistItem,
);

@Schema({ timestamps: true })
export class CreditDocumentChecklist {
  @Prop({ required: true, unique: true })
  @ApiProperty()
  applicationId: string;

  @Prop({ type: [CreditDocumentChecklistItemSchema], default: [] })
  @ApiProperty({ type: () => [CreditDocumentChecklistItem] })
  documents: CreditDocumentChecklistItem[];

  @Prop({ default: false })
  @ApiProperty()
  isComplete: boolean;

  @Prop()
  @ApiPropertyOptional()
  completedAt?: Date;
}

export type CreditDocumentChecklistDocument =
  HydratedDocument<CreditDocumentChecklist>;
export const CreditDocumentChecklistSchema = SchemaFactory.createForClass(
  CreditDocumentChecklist,
);
