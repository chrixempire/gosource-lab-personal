import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import {
  ACTIVITY_LOG_ACTION_TYPE,
  INITIATOR_TYPE,
} from '../interface/activityLog.interface';

export class FilterActivityDto {
  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number;

  @IsOptional()
  @IsString()
  filterBy?: string;

  @IsOptional()
  @IsString()
  filterValue?: string;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  objectId?: string;

  @IsOptional()
  @IsString()
  initiator?: string;

  @IsOptional()
  @IsEnum(INITIATOR_TYPE, {
    message: 'initiatorType must be a valid value.',
  })
  initiatorType?: INITIATOR_TYPE;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsEnum(ACTIVITY_LOG_ACTION_TYPE, {
    message: 'action must be a valid action type.',
  })
  action?: ACTIVITY_LOG_ACTION_TYPE;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  expectedDateFrom?: string;

  @IsOptional()
  @IsDateString()
  expectedDateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  hasPriceChange?: boolean;

  @IsOptional()
  @IsEnum(['AND', 'OR'], {
    message: 'filterOperator must be either AND or OR.',
  })
  filterOperator: 'AND' | 'OR';

  buildFilterConditions(): any[] {
    const filterConditions = [];

    if (this.search) {
      const searchRegex = new RegExp(this.search, 'i');
      filterConditions.push({
        $or: [
          { description: searchRegex },
          { initiatorType: this.search },
          { module: this.search },
          { action: this.search },
          { ipAddress: this.search },
        ],
      });
    }

    // Handle the createdAt range filter using startDate and endDate
    if (this.startDate || this.endDate) {
      const dateConditions = {};
      if (this.startDate) {
        dateConditions['$gte'] = new Date(this.startDate);
      }
      if (this.endDate) {
        dateConditions['$lte'] = new Date(this.endDate);
      }
      filterConditions.push({ createdAt: dateConditions });
    }

    // Handle the createdAt range filter using startDate and endDate
    if (this.expectedDateFrom || this.expectedDateTo) {
      const dateConditions = {};
      if (this.expectedDateFrom) {
        dateConditions['$gte'] = new Date(this.expectedDateFrom);
      }
      if (this.expectedDateTo) {
        dateConditions['$lte'] = new Date(this.expectedDateTo);
      }
      filterConditions.push({ expectedDate: dateConditions });
    }

    if (this.objectId) {
      filterConditions.push({ objectId: this.objectId });
    }

    if (this.initiator) {
      filterConditions.push({ initiator: this.initiator });
    }

    if (this.initiatorType) {
      filterConditions.push({ initiatorType: this.initiatorType });
    }

    if (this.module) {
      filterConditions.push({ module: this.module });
    }

    if (this.action) {
      filterConditions.push({ action: this.action });
    }

    if (this.ipAddress) {
      filterConditions.push({ ipAddress: this.ipAddress });
    }

    if (this.hasPriceChange) {
      // Only include documents where metadata.priceChange === true
      filterConditions.push({ 'metadata.priceChange': true });
    }

    return filterConditions;
  }

  buildQueryCondition(): any {
    const filterConditions = this.buildFilterConditions();

    if (filterConditions.length > 0) {
      return this.filterOperator === 'AND'
        ? { $and: filterConditions }
        : { $or: filterConditions };
    }

    return {};
  }
}
