import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

type AggregationPipelineStage =
  | {
      $lookup: {
        from: string;
        let: { [key: string]: any };
        pipeline: any[];
        as: string;
      };
    }
  | { $addFields: { [key: string]: any } }
  | { $match: { [key: string]: any } }
  | { $sort: { [key: string]: 1 | -1 } }
  | { $project: { [key: string]: number } }
  | { $skip: number }
  | { $limit: number };

export class FilterCategoryDto {
  @IsOptional()
  @IsString()
  sortBy: string = 'name';

  @IsOptional()
  @IsString()
  sortOrder: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number = 1;

  @IsOptional()
  @IsString()
  filterBy?: string;

  @IsOptional()
  @IsString()
  filterValue?: string;

  buildFilterCondition(): any {
    if (this.filterBy && this.filterValue) {
      return { [this.filterBy]: this.filterValue };
    }
    return {};
  }

  buildAggregationPipeline(): AggregationPipelineStage[] {
    const filterConditions = this.buildFilterCondition();
    const skipCount = (this.page - 1) * this.limit;

    const pipeline: AggregationPipelineStage[] = [
      { $match: filterConditions },
      {
        $lookup: {
          from: 'products',
          let: { categoryId: { $toString: '$_id' }, categoryName: '$name' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: [{ $toString: '$category' }, '$$categoryId'] },
                    { $eq: ['$category', '$$categoryName'] },
                  ],
                },
              },
            },
          ],
          as: 'products',
        },
      },
      {
        $addFields: {
          productCount: { $size: '$products' },
        },
      },
      // { $sort: { [this.sortBy]: this.sortOrder === 'asc' ? 1 : -1 } },
      // { $sort: { createdAt: -1 } },
      { $sort: { position: -1 } },
      { $skip: skipCount },
      { $limit: Number(this.limit) },
      {
        $project: {
          name: 1,
          slug: 1,
          desc: 1,
          image: 1,
          productCount: 1,
          createdAt: 1,
          position: 1,
        },
      },
    ];

    return pipeline;
  }
}
