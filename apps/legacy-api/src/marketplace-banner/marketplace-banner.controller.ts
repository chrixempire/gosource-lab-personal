import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MarketplaceBannerService } from './marketplace-banner.service';
import { MarketplaceBannerPublicDto } from './dto/marketplace-banner.dto';

@Controller('marketplace-banners')
@ApiTags('Marketplace banners')
export class MarketplaceBannerController {
  constructor(private readonly marketplaceBannerService: MarketplaceBannerService) {}

  @Get()
  @ApiOkResponse({ type: [MarketplaceBannerPublicDto] })
  async getPublicBanners() {
    return this.marketplaceBannerService.getPublicBanners();
  }
}
