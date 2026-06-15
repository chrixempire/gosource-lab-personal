import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type MarketplaceBannerSettingsDocument =
  HydratedDocument<MarketplaceBannerSettings>;

@Schema({ _id: false })
export class MarketplaceBannerItem {
  @Prop({ required: true })
  @ApiProperty()
  id: string;

  @Prop({ required: true })
  @ApiProperty()
  imageUrl: string;

  @Prop({ required: true })
  storageKey: string;

  @Prop({ required: true, default: '' })
  @ApiProperty()
  alt: string;

  @Prop({ required: false, default: '/market' })
  @ApiProperty()
  linkUrl: string;

  @Prop({ required: true, default: 0 })
  @ApiProperty()
  sortOrder: number;
}

export const MarketplaceBannerItemSchema =
  SchemaFactory.createForClass(MarketplaceBannerItem);

@Schema({ timestamps: true })
export class MarketplaceBannerSettings {
  @Prop({ required: true, unique: true, default: 'default' })
  key: string;

  @Prop({ type: [MarketplaceBannerItemSchema], default: [] })
  banners: MarketplaceBannerItem[];
}

export const MarketplaceBannerSettingsSchema = SchemaFactory.createForClass(
  MarketplaceBannerSettings,
);
