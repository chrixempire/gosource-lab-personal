import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { Roles } from '../auth/decorator/role.decorator';
import { AdminRoles } from '../auth/enum/admin.enum';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';
import { RequiredPermission } from '../role/enum/required-permission';
import { MarketplaceBannerService } from '../../marketplace-banner/marketplace-banner.service';
import {
  MarketplaceBannerEntryDto,
  MarketplaceBannerPublicDto,
  SaveMarketplaceBannersDto,
} from '../../marketplace-banner/dto/marketplace-banner.dto';

const bannerUploadOptions = {
  limits: {
    fileSize: 8_000_000,
  },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!file.fieldname?.startsWith('banner_')) {
      callback(null, false);
      return;
    }

    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
      callback(new BadRequestException('Please upload a valid image'), false);
      return;
    }

    callback(null, true);
  },
};

@Controller('admin/marketplace-banners')
@AdminAuth()
@ApiTags('Admin / Marketplace banners')
export class AdminMarketplaceBannerController {
  constructor(
    private readonly marketplaceBannerService: MarketplaceBannerService,
  ) {}

  @Get()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_PROMOTIONS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({ type: [MarketplaceBannerPublicDto] })
  async getBanners() {
    return this.marketplaceBannerService.getAdminBanners();
  }

  @Put()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_PROMOTION)
  @UseGuards(AdminRolesGuard)
  @UseInterceptors(AnyFilesInterceptor(bannerUploadOptions))
  @ApiOkResponse({ type: [MarketplaceBannerPublicDto] })
  async saveBanners(
    @Body('banners') bannersRaw: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    let banners: MarketplaceBannerEntryDto[] = [];

    try {
      const parsed = JSON.parse(bannersRaw) as SaveMarketplaceBannersDto | MarketplaceBannerEntryDto[];
      banners = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.banners)
          ? parsed.banners
          : [];
    } catch {
      throw new BadRequestException('Invalid banners payload');
    }

    return this.marketplaceBannerService.saveBanners(banners, files ?? []);
  }
}
