import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './entities/category.entity';
import { Model, Types } from 'mongoose';
import { ObjectCannedACL, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../s3Client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll() {
    const categories: Category[] = await this.getCategoriesWithProducts();
    return this.buildResponse(categories);
  }

  async findOne(categoryId: string) {
    const categories = await this.categoryModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(categoryId) },
      },
      {
        $lookup: {
          from: 'products',
          let: { categoryId: '$_id', categoryName: '$name' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ['$category', '$$categoryId'] },
                        { $eq: ['$category', '$$categoryName'] },
                      ],
                    },
                    {
                      $or: [
                        { $eq: ['$active', true] },
                        { $eq: [{ $type: '$active' }, 'missing'] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'products',
        },
      },
    ]);

    if (!categories || categories.length === 0) {
      throw new NotFoundException('Category not found');
    }

    return this.buildResponse(categories[0]);
  }

  /**
   * Get only categories without products.
   *
   * @returns
   */
  async getOnlyCategories(): Promise<any> {
    const cacheKey = 'only_categories';

    // Try to retrieve the categories from the cache
    let categories: Category[] =
      await this.cacheManager.get<Category[]>(cacheKey);

    if (!categories) {
      // If not found in cache, query the database
      categories = await this.categoryModel.find().sort({ position: 1 });

      // Sort categories to put Black Friday first
      categories = this.sortCategoriesWithBlackFridayFirst(categories);

      // Store the sorted result in the cache for future requests
      await this.cacheManager.set(cacheKey, categories, {
        ttl: 86400,
      });
    }

    return this.buildResponse(categories);
  }

  /**
   * Get only a single category without products.
   *
   * @returns
   */
  async getOnlyCategory(categoryId: string): Promise<any> {
    const category: Category[] = await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.buildResponse(category);
  }

  async getCategoriesWithProducts(): Promise<CategoryDocument[]> {
    const cacheKey = 'categories_with_products';

    // Try to retrieve the cached categories with products
    let categoriesWithProducts: CategoryDocument[] =
      await this.cacheManager.get<CategoryDocument[]>(cacheKey);

    if (!categoriesWithProducts) {
      // If not found in cache, perform the aggregation query
      categoriesWithProducts = await this.categoryModel.aggregate([
        {
          $lookup: {
            from: 'products',
            let: { categoryId: '$_id', categoryName: '$name' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $or: [
                          { $eq: ['$category', '$$categoryId'] },
                          { $eq: ['$category', '$$categoryName'] },
                        ],
                      },
                      {
                        $or: [
                          { $eq: ['$active', true] },
                          { $eq: [{ $type: '$active' }, 'missing'] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'products',
          },
        },
        { $sort: { position: 1 } },
        {
          $addFields: {
            productCount: { $size: '$products' },
          },
        },
      ]);

      // Sort Black Friday first after getting the results
      categoriesWithProducts.sort((a, b) => {
        const isABlackFriday = a.name.toLowerCase().includes('black friday');
        const isBBlackFriday = b.name.toLowerCase().includes('black friday');

        if (isABlackFriday) return -1;
        if (isBBlackFriday) return 1;
        return 0;
      });

      await this.cacheManager.set(cacheKey, categoriesWithProducts, {
        ttl: 86400,
      });
    }

    return categoriesWithProducts;
  }

  async updateCategoryImage(categoryId: string, file: any): Promise<any> {
    const category: CategoryDocument =
      await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = randomString + randomString;

    const params = {
      Bucket: process.env.CDN_BUCKET_NAME,
      Key: `${fileName}${file.originalname}`,
      Body: file.buffer,
      ACL: 'public-read' as ObjectCannedACL,
    };

    const image = await s3Client.send(new PutObjectCommand(params));
    let imageUrl: string;
    if (image) {
      imageUrl = `https://${process.env.CDN_BUCKET_NAME}.${process.env.CDN_URL}/${fileName}${file.originalname}`;
    }

    const updateCategory = await this.categoryModel.findByIdAndUpdate(
      categoryId,
      { image: imageUrl },
      { new: true },
    );

    if (updateCategory) {
      await this.cacheManager.del('only_categories');
      await this.cacheManager.del('categories_with_products');

      return this.buildResponse(updateCategory);
    }
  }

  private sortCategoriesWithBlackFridayFirst(
    categories: Category[],
  ): Category[] {
    return categories.sort((a, b) => {
      // Check for "Black Friday" in name or slug (case insensitive)
      const isABlackFriday = a.name
        .toLowerCase()
        .includes('black friday sales');
      const isBBlackFriday = b.name
        .toLowerCase()
        .includes('black friday sales');
      if (isABlackFriday && !isBBlackFriday) return -1;
      if (!isABlackFriday && isBBlackFriday) return 1;

      // If neither or both are Black Friday, maintain original order
      return 0;
    });
  }

  buildResponse(data: Category | Category[]) {
    return {
      status: true,
      message: 'successfully',
      data,
    };
  }
}
