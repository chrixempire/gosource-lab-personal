import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AdminUser } from '../../admin/auth/schema/adminUser.schema';
import { CreditTimelineStatusT } from '../enum/credit.enum';
import { ApiProperty } from '@nestjs/swagger';

// NB: we can probably make this a global timeline for all schemas
@Schema({ _id: false })
export class TimelineEntry {
  @Prop({ required: true, enum: CreditTimelineStatusT })
  @ApiProperty()
  status: string;

  @Prop({ type: Date, default: Date.now })
  @ApiProperty()
  changedAt: Date;

  @Prop({ type: Types.ObjectId, ref: AdminUser.name, required: false })
  @ApiProperty()
  changedBy?: Types.ObjectId;

  @Prop()
  @ApiProperty()
  note?: string;
}

export const TimelineEntrySchema = SchemaFactory.createForClass(TimelineEntry);
