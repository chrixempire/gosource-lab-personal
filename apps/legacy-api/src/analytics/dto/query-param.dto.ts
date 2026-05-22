import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryParamsDto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  sortBy?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty()
  page?: number;

  @IsOptional()
  @IsString()
  @ApiProperty()
  filterBy?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  filterValue?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  productId?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty()
  endDate?: string;

  @IsOptional()
  @ApiProperty()
  branchId?: string;

  @IsOptional()
  @ApiProperty()
  name?: string;

  @IsOptional()
  @ApiProperty()
  category?: string;

  @IsOptional()
  @ApiProperty()
  brand?: string;
}
