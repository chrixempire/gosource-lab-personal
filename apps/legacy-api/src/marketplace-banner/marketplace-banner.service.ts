import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { S3Service } from '../cloudinary/s3.service';
import { successResponse } from '../utils/responses';
import { MarketplaceBannerEntryDto } from './dto/marketplace-banner.dto';
import {
  MarketplaceBannerItem,
  MarketplaceBannerSettings,
  MarketplaceBannerSettingsDocument,
} from './schemas/marketplace-banner-settings.schema';

const SETTINGS_KEY = 'default';
const MAX_BANNERS = 4;
const BANNER_FILE_PREFIX = 'banner_';

@Injectable()
export class MarketplaceBannerService {
  constructor(
    @InjectModel(MarketplaceBannerSettings.name)
    private readonly settingsModel: Model<MarketplaceBannerSettingsDocument>,
    private readonly s3Service: S3Service,
  ) {}

  async getAdminBanners() {
    const settings = await this.getOrCreateSettings();
    return successResponse('Marketplace banners fetched successfully', {
      banners: this.sortBanners(settings.banners).map((banner) =>
        this.toPublicBanner(banner),
      ),
    });
  }

  async getPublicBanners() {
    const settings = await this.settingsModel.findOne({ key: SETTINGS_KEY });
    const banners = settings?.banners ?? [];

    return successResponse('Marketplace banners fetched successfully', {
      banners: this.sortBanners(banners).map((banner) =>
        this.toPublicBanner(banner),
      ),
    });
  }

  async saveBanners(
    entries: MarketplaceBannerEntryDto[],
    files: Express.Multer.File[] = [],
  ) {
    if (!Array.isArray(entries)) {
      throw new BadRequestException('banners payload is required');
    }

    if (entries.length > MAX_BANNERS) {
      throw new BadRequestException(`A maximum of ${MAX_BANNERS} banners is allowed`);
    }

    const filesByBannerId = this.mapBannerFiles(files);
    const settings = await this.getOrCreateSettings();
    const previousById = new Map(
      (settings.banners ?? []).map((banner) => [banner.id, banner]),
    );
    const nextBannerIds = new Set(entries.map((entry) => entry.id));

    const nextBanners: MarketplaceBannerItem[] = [];

    for (const [index, entry] of entries.entries()) {
      const uploadFile = filesByBannerId.get(entry.id);
      const previous = previousById.get(entry.id);

      if (uploadFile) {
        const uploaded = await this.s3Service.uploadFile(uploadFile);
        nextBanners.push({
          id: entry.id,
          imageUrl: uploaded.url,
          storageKey: uploaded.key,
          alt: String(entry.alt ?? previous?.alt ?? 'Marketplace banner').trim(),
          linkUrl: this.normalizeLinkUrl(entry.linkUrl ?? previous?.linkUrl),
          sortOrder: index,
        });
        continue;
      }

      const imageUrl = String(entry.imageUrl ?? previous?.imageUrl ?? '').trim();
      const storageKey = String(
        entry.storageKey ?? previous?.storageKey ?? '',
      ).trim();

      if (!imageUrl || !storageKey) {
        throw new BadRequestException(
          `Banner "${entry.id}" is missing an image. Upload a file or keep an existing banner.`,
        );
      }

      nextBanners.push({
        id: entry.id,
        imageUrl,
        storageKey,
        alt: String(entry.alt ?? previous?.alt ?? 'Marketplace banner').trim(),
        linkUrl: this.normalizeLinkUrl(entry.linkUrl ?? previous?.linkUrl),
        sortOrder: index,
      });
    }

    const removedBanners = (settings.banners ?? []).filter(
      (banner) => !nextBannerIds.has(banner.id),
    );
    const storageKeysToDelete = new Set<string>();

    for (const banner of removedBanners) {
      if (banner.storageKey) {
        storageKeysToDelete.add(banner.storageKey);
      }
    }

    for (const entry of entries) {
      const uploadFile = filesByBannerId.get(entry.id);
      if (!uploadFile) {
        continue;
      }

      const previous = previousById.get(entry.id);
      if (previous?.storageKey) {
        storageKeysToDelete.add(previous.storageKey);
      }
    }

    settings.banners = nextBanners;
    await settings.save();

    const activeStorageKeys = new Set(
      nextBanners.map((banner) => banner.storageKey).filter(Boolean),
    );

    for (const storageKey of storageKeysToDelete) {
      if (!activeStorageKeys.has(storageKey)) {
        await this.safeDeleteStorageKey(storageKey);
      }
    }

    return successResponse('Marketplace banners saved successfully', {
      banners: this.sortBanners(settings.banners).map((banner) =>
        this.toPublicBanner(banner),
      ),
    });
  }

  private async getOrCreateSettings() {
    const existing = await this.settingsModel.findOne({ key: SETTINGS_KEY });
    if (existing) {
      return existing;
    }

    return this.settingsModel.create({ key: SETTINGS_KEY, banners: [] });
  }

  private mapBannerFiles(files: Express.Multer.File[]) {
    const map = new Map<string, Express.Multer.File>();

    for (const file of files) {
      if (!file.fieldname?.startsWith(BANNER_FILE_PREFIX)) {
        continue;
      }

      const bannerId = file.fieldname.slice(BANNER_FILE_PREFIX.length).trim();
      if (!bannerId) {
        continue;
      }

      map.set(bannerId, file);
    }

    return map;
  }

  private async safeDeleteStorageKey(storageKey: string) {
    const key = String(storageKey ?? '').trim();
    if (!key) {
      return;
    }

    try {
      await this.s3Service.deleteFile(key);
    } catch (error) {
      console.warn(`Failed to delete marketplace banner object "${key}":`, error);
    }
  }

  private sortBanners(banners: MarketplaceBannerItem[]) {
    return [...banners].sort((left, right) => left.sortOrder - right.sortOrder);
  }

  private normalizeLinkUrl(value?: string | null) {
    const link = String(value ?? '/market').trim();
    return link || '/market';
  }

  private toPublicBanner(banner: MarketplaceBannerItem) {
    return {
      id: banner.id,
      imageUrl: banner.imageUrl,
      alt: banner.alt,
      linkUrl: banner.linkUrl ?? '/market',
    };
  }
}
