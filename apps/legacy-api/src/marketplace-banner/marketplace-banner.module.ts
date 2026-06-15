import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketplaceBannerController } from './marketplace-banner.controller';
import { MarketplaceBannerService } from './marketplace-banner.service';
import {
  MarketplaceBannerSettings,
  MarketplaceBannerSettingsSchema,
} from './schemas/marketplace-banner-settings.schema';
import { S3Service } from '../cloudinary/s3.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MarketplaceBannerSettings.name,
        schema: MarketplaceBannerSettingsSchema,
      },
    ]),
  ],
  controllers: [MarketplaceBannerController],
  providers: [MarketplaceBannerService, S3Service],
  exports: [MarketplaceBannerService],
})
export class MarketplaceBannerModule {}
