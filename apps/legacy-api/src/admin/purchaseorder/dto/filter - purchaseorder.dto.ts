import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';
import {
  ProductTypeEnum,
  PurchaseOrderStatus,
} from '../interface/purchaseorder.interface';

export class FilterPurchaseOrderDto {
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
  @IsArray()
  @IsEnum(PurchaseOrderStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: PurchaseOrderStatus[];

  @IsOptional()
  @IsArray()
  @IsEnum(ProductTypeEnum, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  productType?: ProductTypeEnum[];

  @IsOptional()
  @IsString()
  id?: string;

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
  @IsEnum(['AND', 'OR'], {
    message: 'filterOperator must be either AND or OR.',
  })
  filterOperator: 'AND' | 'OR';

  buildFilterConditions(): any[] {
    const filterConditions = [];

    if (this.status && this.status.length > 0) {
      filterConditions.push({ status: { $in: this.status } });
    }

    if (this.productType && this.productType.length > 0) {
      filterConditions.push({ productType: { $in: this.productType } });
    }

    if (this.search) {
      const searchRegex = new RegExp(this.search, 'i');
      filterConditions.push({
        $or: [
          { note: searchRegex },
          { status: searchRegex },
          { productType: this.search },
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
