import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Product,
  ProductDocument,
} from '../../product/entities/product.entity';
import { Model } from 'mongoose';
import {
  Category,
  CategoryDocument,
} from '../../category/entities/category.entity';
import { Unit } from '../../product/entities/units.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateItemDto } from './dto/item.dto';
import * as sharp from 'sharp';
import { ObjectCannedACL, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../s3Client';
import { Cache } from 'cache-manager';
import { successResponse } from '../../utils/responses';

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Unit.name) private unitModel: Model<Unit>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Add new product.
   *
   * @param productData
   * @param files
   * @returns
   */
  async addProduct(productData: CreateItemDto, files: any): Promise<any> {
    const { category } = productData;

    const categoryDetails: CategoryDocument =
      await this.categoryModel.findById(category);

    if (!categoryDetails) {
      throw new NotFoundException('Category not found');
    }

    // Upload images if present
    const uploadedProductImages = [];
    for (const file of files) {
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = randomString + randomString;

      const compressedBuffer = await sharp(file.buffer)
        .jpeg({ quality: 50 })
        .toBuffer();

      const params = {
        Bucket: process.env.CDN_BUCKET_NAME,
        Key: `${fileName}${file.originalname}`,
        Body: compressedBuffer,
        ACL: 'public-read' as ObjectCannedACL,
      };

      const data = await s3Client.send(new PutObjectCommand(params));

      if (data) {
        uploadedProductImages.push({
          url: `https://${process.env.CDN_BUCKET_NAME}.${process.env.CDN_URL}/${params.Key}`,
          id: `${process.env.CDN_BUCKET_NAME}/${fileName}`,
        });
      }
    }

    const newProductDetails = {
      ...productData,
      images: uploadedProductImages,
    };

    const addProduct: ProductDocument =
      await this.productModel.create(newProductDetails);

    if (addProduct) {
      await Promise.all([
        this.cacheManager.del('all_products_sorted'),
        this.cacheManager.del('categories_with_products'),
      ]);

      return successResponse('New product added successfully', addProduct);
    }
  }
}
