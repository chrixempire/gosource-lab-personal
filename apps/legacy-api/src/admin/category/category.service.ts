import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Category,
  CategoryDocument,
} from '../../category/entities/category.entity';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { s3Client } from '../../s3Client';
import { ObjectCannedACL, PutObjectCommand } from '@aws-sdk/client-s3';
import { DeleteCategoryDto } from './dto/delete-category.dto';
import { Product } from '../../product/entities/product.entity';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { UpdateCategoryDto } from '../../category/dto/update-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { ActivityLog } from '../../activity/schema/activityLog.schema';
import {
  ACTIVITY_LOG_ACTION_TYPE,
  IActivityLog,
} from '../../activity/interface/activityLog.interface';
import { adminInitiator } from '../../utils/activity-initiator.util';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(ActivityLog.name)
    private readonly activityLogModel: Model<ActivityLog>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Create a new category.
   *
   * @param categoryData
   * @returns
   */
  async createCategory(categoryData: any, file: any, admin?: any): Promise<any> {
    const maxPosition = await this.categoryModel
      .findOne()
      .sort({ position: -1 })
      .select('position')
      .lean();

    const category: CategoryDocument = await this.categoryModel.findOne({
      name: categoryData.name,
    });

    if (category) {
      throw new ConflictException(
        `Category with the name ${categoryData.name} already exist.`,
      );
    }

    const { name, desc } = categoryData;
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = randomString + randomString;
    let imageUrl: string;
    if (file) {
      const params = {
        Bucket: process.env.CDN_BUCKET_NAME,
        Key: `${fileName}${file.originalname}`,
        Body: file.buffer,
        ACL: 'public-read' as ObjectCannedACL,
      };

      const image = await s3Client.send(new PutObjectCommand(params));
      if (image) {
        imageUrl = `https://${process.env.CDN_BUCKET_NAME}.${process.env.CDN_URL}/${fileName}${file.originalname}`;
      }
    }

    const newCategory = await this.categoryModel.create({
      name,
      desc,
      image: imageUrl,
      position: maxPosition ? maxPosition.position + 1 : 0,
    });

    if (newCategory) {
      await this.activityLogModel.create({
        objectId: newCategory.id,
        description: `Created category - Name: ${newCategory.name}`,
        ...adminInitiator(admin),
        metadata: { name: newCategory.name },
        action: ACTIVITY_LOG_ACTION_TYPE.CREATE,
        module: Category.name,
      } as IActivityLog);

      await Promise.all([
        this.cacheManager.del('only_categories'),
        this.cacheManager.del('all_products_sorted'),
        this.cacheManager.del('categories_with_products'),
      ]);

      return {
        status: true,
        message: 'Category created successfully',
        data: newCategory,
      };
    }
  }

  /**
   * Get all categories.
   *
   * @returns
   */

  async getCategories(queryParams: FilterCategoryDto): Promise<any> {
    const filterCustomerDto = Object.assign(
      new FilterCategoryDto(),
      queryParams,
    );

    const pipeline = filterCustomerDto.buildAggregationPipeline();

    try {
      const categories = await this.categoryModel.aggregate(pipeline);

      const filterConditions = filterCustomerDto.buildFilterCondition();
      const totalDocuments =
        await this.categoryModel.countDocuments(filterConditions);

      return {
        status: true,
        message: 'Categories with product counts fetched successfully',
        data: {
          totalDocuments,
          page: queryParams.page || 1,
          limit: Number(queryParams.limit) || 20,
          totalPages: Math.ceil(
            totalDocuments / (Number(queryParams.limit) || 20),
          ),
          categories: categories || [],
        },
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get a single category.
   *
   * @param categoryId
   * @returns
   */
  async getSingleCategory(categoryId: string): Promise<any> {
    const category: CategoryDocument =
      await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      status: true,
      message: 'Category fetched successfully',
      data: category,
    };
  }

  /**
   * Update category.
   *
   * @param categoryId
   * @param categoryData
   * @returns
   */
  async updateCategory(
    categoryId: string,
    categoryData: UpdateCategoryDto,
    file: any,
    admin?: any,
  ): Promise<any> {
    const category: CategoryDocument =
      await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = randomString + randomString;
    let imageUrl = category.image;

    if (file) {
      const params = {
        Bucket: process.env.CDN_BUCKET_NAME,
        Key: `${fileName}${file.originalname}`,
        Body: file.buffer,
        ACL: 'public-read' as ObjectCannedACL,
      };

      const image = await s3Client.send(new PutObjectCommand(params));
      if (image) {
        imageUrl = `https://${process.env.CDN_BUCKET_NAME}.${process.env.CDN_URL}/${fileName}${file.originalname}`;
      }
    }

    // Capture field-level changes (old → new) before applying the update.
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (
      categoryData.name != null &&
      categoryData.name !== category.name
    ) {
      changes.title = { old: category.name, new: categoryData.name };
    }
    if (
      categoryData.desc != null &&
      categoryData.desc !== category.desc
    ) {
      changes.description = { old: category.desc ?? '', new: categoryData.desc };
    }
    if (imageUrl !== category.image) {
      changes.image = { old: category.image ?? null, new: imageUrl };
    }

    categoryData['image'] = imageUrl;

    const update = await this.categoryModel.findByIdAndUpdate(
      categoryId,
      {
        ...categoryData,
      },
      { new: true },
    );

    if (update) {
      await this.activityLogModel.create({
        objectId: update.id,
        description: `Updated category - Name: ${update.name}`,
        ...adminInitiator(admin),
        metadata: { name: update.name, changes },
        action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
        module: Category.name,
      } as IActivityLog);

      await this.cacheManager.del('only_categories');
      await this.cacheManager.del('categories_with_products');

      return {
        status: true,
        message: 'Category updated successfully',
        data: update,
      };
    }
  }

  async remove(
    id: string,
    deleteCategoryDto: DeleteCategoryDto,
    admin?: any,
  ): Promise<any> {
    const { newCategoryId } = deleteCategoryDto;
    const deleteAll: boolean = deleteCategoryDto.deleteAll;

    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (Boolean(deleteAll) === true) {
      // Delete category and all associated products
      await Promise.all([
        this.categoryModel.findByIdAndDelete(id),
        this.productModel.deleteMany({ category: id }),
      ]);

      await this.activityLogModel.create({
        objectId: id,
        description: `Deleted category and its products - Name: ${category.name}`,
        ...adminInitiator(admin),
        metadata: { name: category.name, deleteAll: true },
        action: ACTIVITY_LOG_ACTION_TYPE.DELETE,
        module: Category.name,
      } as IActivityLog);

      return {
        status: true,
        message: 'Category and associated products deleted successfully',
      };
    }

    if (Boolean(deleteAll) === false && newCategoryId) {
      // Ensure the new category exists
      const targetCategory = await this.categoryModel.findById(newCategoryId);
      if (!targetCategory) {
        throw new BadRequestException('Target category does not exist');
      }

      // Transfer products from deleted category to new category
      await Promise.all([
        this.categoryModel.findByIdAndDelete(id),
        this.productModel.updateMany(
          { category: id },
          { $set: { category: newCategoryId } },
        ),
      ]);

      await this.activityLogModel.create({
        objectId: id,
        description: `Deleted category "${category.name}" and moved its products to "${targetCategory.name}"`,
        ...adminInitiator(admin),
        metadata: {
          name: category.name,
          deleteAll: false,
          newCategoryId,
        },
        action: ACTIVITY_LOG_ACTION_TYPE.DELETE,
        module: Category.name,
      } as IActivityLog);

      return {
        status: true,
        message: 'Category deleted and products transferred to new category',
      };
    }

    throw new BadRequestException('Invalid delete choice');
  }

  // One time function to assign positions to existing categories. Will be removed later.
  async assignPositions() {
    const categories = await this.categoryModel.find().sort({ createdAt: 1 });

    await Promise.all(
      categories.map((category, index) =>
        this.categoryModel.updateOne(
          { _id: category._id },
          { $set: { position: index } },
        ),
      ),
    );

    return {
      status: true,
      message: 'Positions assigned to existing categories',
    };
  }

  async rearrangeCategory(
    data: ReorderCategoriesDto,
    admin?: any,
  ): Promise<any> {
    const { rearrangedCategories } = data;
    if (rearrangedCategories.length === 0) {
      throw new BadRequestException('Invalid rearrangement data');
    }

    const session = await this.categoryModel.db.startSession();

    try {
      await session.withTransaction(async () => {
        // Step 1: Temporarily clear positions (avoid unique index conflicts).
        // Must run sequentially — parallel ops on one session break txn numbers.
        for (let index = 0; index < rearrangedCategories.length; index++) {
          const category = rearrangedCategories[index];
          const updated = await this.categoryModel.findByIdAndUpdate(
            category.id,
            { position: -(index + 1) },
            { session },
          );

          if (!updated) {
            throw new NotFoundException('One or more categories not found');
          }
        }

        // Step 2: Reassign final positions
        for (const category of rearrangedCategories) {
          const updated = await this.categoryModel.findByIdAndUpdate(
            category.id,
            { position: category.position },
            { new: true, session },
          );

          if (!updated) {
            throw new NotFoundException('One or more categories not found');
          }
        }
      });

      await this.cacheManager.del('only_categories');
      await this.cacheManager.del('categories_with_products');

      await this.activityLogModel.create({
        objectId: null,
        description: `Reordered ${rearrangedCategories.length} categories`,
        ...adminInitiator(admin),
        metadata: { count: rearrangedCategories.length },
        action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
        module: Category.name,
      } as IActivityLog);

      return { status: true, message: 'Categories rearranged successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ConflictException(`Reordering failed: ${message}`);
    } finally {
      await session.endSession();
    }
  }
}
