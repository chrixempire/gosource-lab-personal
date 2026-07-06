import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketplaceBannerController } from './marketplace-banner.controller';
import { MarketplaceBannerService } from './marketplace-banner.service';
import {
  MarketplaceBannerSettings,
  MarketplaceBannerSettingsSchema,
} from './schemas/marketplace-banner-settings.schema';
import { S3Service } from '../cloudinary/s3.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MarketplaceBannerSettings.name,
        schema: MarketplaceBannerSettingsSchema,
      },
    ]),
    ActivityModule,
  ],
  controllers: [MarketplaceBannerController],
  providers: [MarketplaceBannerService, S3Service],
  exports: [MarketplaceBannerService],
})
export class MarketplaceBannerModule {}
