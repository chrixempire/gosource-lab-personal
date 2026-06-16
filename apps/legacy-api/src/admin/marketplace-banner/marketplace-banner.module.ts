import { Module } from '@nestjs/common';
import { AdminMarketplaceBannerController } from './marketplace-banner.controller';
import { MarketplaceBannerModule } from '../../marketplace-banner/marketplace-banner.module';

@Module({
  imports: [MarketplaceBannerModule],
  controllers: [AdminMarketplaceBannerController],
})
export class AdminMarketplaceBannerModule {}
