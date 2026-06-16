import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MarketplaceBannerEntryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  id: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiPropertyOptional()
  alt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiPropertyOptional()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  storageKey?: string;
}

export class SaveMarketplaceBannersDto {
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => MarketplaceBannerEntryDto)
  @ApiProperty({ type: [MarketplaceBannerEntryDto] })
  banners: MarketplaceBannerEntryDto[];
}

export class MarketplaceBannerPublicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  alt: string;

  @ApiPropertyOptional()
  linkUrl?: string | null;
}
