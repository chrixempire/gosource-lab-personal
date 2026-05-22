import {
  IsArray,
  ValidateNested,
  IsMongoId,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class RearrangedCategoryDto {
  @IsMongoId()
  id: string;

  @IsInt()
  @Min(0)
  position: number;
}

export class ReorderCategoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RearrangedCategoryDto)
  rearrangedCategories: RearrangedCategoryDto[];
}
