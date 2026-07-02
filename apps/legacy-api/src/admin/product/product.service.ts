import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductStockUpdatedEvent } from './events/product-stock-updated.event';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Connection, Model, Types } from 'mongoose';
import { Product, ProductDocument } from 'src/product/entities/product.entity';
import { NewProductInterface } from './interface/product.interface';
import {
  Category,
  CategoryDocument,
} from '../../category/entities/category.entity';
import { s3Client } from '../../s3Client';
import { ObjectCannedACL, PutObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  CreateBatchProductDto,
  CreateProductDto,
  CreateUnitDto,
  DateFilterDto,
  DeductBatchProductDto,
} from './dto/create-product.dto';
import { Unit } from '../../product/entities/units.entity';
import { successResponse } from '../../utils/responses';
import { OrderFilterParams, ProductFilterUtil } from '../../utils/filter';
import {
  ACTIVITY_LOG_ACTION_TYPE,
  IActivityLog,
  INITIATOR_TYPE,
} from '../../activity/interface/activityLog.interface';
import { ActivityLog } from '../../activity/schema/activityLog.schema';
import { parseISO } from 'date-fns';
import { getDateFilter } from '../../utils/helpers';
import { Order } from '../../order/entities/order.entity';
import {
  ORDER_FINANCIAL_SNAPSHOT_VERSION,
  snapshotOrderFinancialLines,
} from '../../order/order-financials';
import {
  ORDER_PAYMENT_STATUS,
  ORDER_STATUS,
} from '../../order/interface/order.interface';
import { InventoryMovement } from '../../product/entities/inventoryMovement.entity';
import { StockCount } from './schema/stockCount';
import {
  CreateStockCountDto,
  QueryFilterDto,
} from './dto/create-stock-count.dto';
import { createMoney } from '../../utils/money';
import {
  buildExpectedPromotionDiscount,
  buildPromotionDiscountPatch,
} from '../../utils/promotion-discount.util';
import { buildLowStockPatch } from '../../utils/low-stock.util';

@Injectable()
export class ProductService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Unit.name) private unitModel: Model<Unit>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(InventoryMovement.name)
    private inventoryMovementModel: Model<InventoryMovement>,
    @InjectModel(StockCount.name) private stockCountModel: Model<StockCount>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private eventEmitter: EventEmitter2,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * Add new product.
   *
   * @param productData
   * @param files
   * @returns
   */
  async addProduct(productData: CreateProductDto, files: any): Promise<any> {
    const { name } = productData;
    const category: CategoryDocument = await this.categoryModel.findById(
      productData.category,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const productCheck: ProductDocument = await this.productModel.findOne({
      name,
    });

    if (productCheck) {
      throw new ConflictException('A product with the same name already exist');
    }

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
      version: 'v2',
    };

    const addProduct: ProductDocument =
      await this.productModel.create(newProductDetails);

    const activityLog: IActivityLog = {
      objectId: addProduct.id,
      description: `Add product - Name: ${newProductDetails.name}`,
      initiator: null,
      initiatorType: INITIATOR_TYPE.ADMIN,
      metadata: {},
      action: ACTIVITY_LOG_ACTION_TYPE.CREATE,
      module: Product.name,
    };
    await this.activityLogModel.create(activityLog);
    if (addProduct) {
      await this.cacheManager.del('all_products_sorted');
      await this.cacheManager.del('categories_with_products');

      return {
        status: true,
        message: 'New product added successfully',
        data: addProduct,
      };
    }
  }

  /**
   * Create a custom unit.
   *
   * @param data
   * @returns {object}
   */
  async createUnit(data: CreateUnitDto): Promise<any> {
    const { name } = data;
    const unit = await this.unitModel.findOne({ name });
    if (unit) {
      throw new ConflictException('Unit already exist');
    }

    const newUnit = await this.unitModel.create(data);

    if (newUnit) {
      return {
        status: true,
        message: 'Unit created successfully',
        data: newUnit,
      };
    }
  }

  /**
   * Get all units.
   *
   * @returns {object}
   */
  async getUnits(): Promise<any> {
    const units = await this.unitModel.find();

    return {
      status: true,
      message: 'Units fetched successfully',
      data: units,
    };
  }

  /**
   * Add new product.
   *
   * @param productData
   * @param files
   * @returns
   */
  async updateProduct(
    productData: NewProductInterface,
    productId: string,
    files: any,
  ): Promise<any> {
    const product: ProductDocument =
      await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let newProductDetails: any = {};

    // Get existing images
    const existingImages = product.images || [];
    let updatedImages = [...existingImages];

    // Handle image updates if files are present
    if (files && files.length) {
      // Parse imageUpdates string into an array of objects
      let imageUpdates = [];
      if (
        productData.imageUpdates &&
        typeof productData.imageUpdates === 'string'
      ) {
        try {
          // Replace JavaScript object notation with valid JSON format
          const jsonString = productData.imageUpdates
            .replace(/(\w+):/g, '"$1":') // Add quotes around property names
            .replace(/'/g, '"'); // Replace single quotes with double quotes
          imageUpdates = JSON.parse(jsonString);
        } catch (error) {
          console.error(
            'Error parsing imageUpdates:',
            error,
            productData.imageUpdates,
          );
          // If parsing fails, initialize as empty array
          imageUpdates = [];
        }
      }

      // Process each new file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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
          // Check if this file has an associated imageId to update
          const updateInfo = imageUpdates.find(
            (update) => update.fileIndex === i,
          );

          if (updateInfo && updateInfo.imageId) {
            // Find and update the existing image with matching ID
            const imageIndex = updatedImages.findIndex(
              (img) => img.id === updateInfo.imageId,
            );
            if (imageIndex !== -1) {
              updatedImages[imageIndex] = {
                url: `https://${process.env.CDN_BUCKET_NAME}.${process.env.CDN_URL}/${params.Key}`,
                id: `${process.env.CDN_BUCKET_NAME}/${fileName}`,
              };
            } else {
              // If no matching ID found, add as new image
              updatedImages.push({
                url: `https://${process.env.CDN_BUCKET_NAME}.${process.env.CDN_URL}/${params.Key}`,
                id: `${process.env.CDN_BUCKET_NAME}/${fileName}`,
              });
            }
          } else {
            // No imageId provided, add as new image
            updatedImages.push({
              url: `https://${process.env.CDN_BUCKET_NAME}.${process.env.CDN_URL}/${params.Key}`,
              id: `${process.env.CDN_BUCKET_NAME}/${fileName}`,
            });
          }
        }
      }
    }

    // Handle image removal (independent of file uploads)
    if (
      productData.imagesToRemove &&
      typeof productData.imagesToRemove === 'string'
    ) {
      try {
        // Parse imagesToRemove string into an array
        const jsonString = productData.imagesToRemove
          .replace(/(\w+):/g, '"$1":') // Add quotes around property names (if needed)
          .replace(/'/g, '"'); // Replace single quotes with double quotes
        const imagesToRemove = JSON.parse(jsonString);

        // Remove specified images
        if (Array.isArray(imagesToRemove) && imagesToRemove.length > 0) {
          updatedImages = updatedImages.filter(
            (img) => !imagesToRemove.includes(img.id),
          );
        }
      } catch (error) {
        console.error(
          'Error parsing imagesToRemove:',
          error,
          productData.imagesToRemove,
        );
        // Continue without removing images if parsing fails
      }
    } else if (
      Array.isArray(productData.imagesToRemove) &&
      productData.imagesToRemove.length > 0
    ) {
      // Handle case where imagesToRemove is already an array
      updatedImages = updatedImages.filter(
        (img) => !productData.imagesToRemove.includes(img.id),
      );
    }

    // Only update images if there were changes (files uploaded or images removed)
    if (
      (files && files.length > 0) ||
      (productData.imagesToRemove &&
        ((typeof productData.imagesToRemove === 'string' &&
          productData.imagesToRemove.length > 0) ||
          (Array.isArray(productData.imagesToRemove) &&
            productData.imagesToRemove.length > 0)))
    ) {
      newProductDetails['images'] = updatedImages;
    }

    // Create a clean version of productData without the image-related fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { imageUpdates, imagesToRemove, ...cleanProductData } = productData;

    const incomingCategory = cleanProductData.category;
    let resolvedCategory: unknown = product.category;

    if (typeof incomingCategory === 'string' && incomingCategory.trim()) {
      const trimmedCategory = incomingCategory.trim();

      if (Types.ObjectId.isValid(trimmedCategory)) {
        resolvedCategory = new Types.ObjectId(trimmedCategory);
      } else {
        const matchedCategory = await this.categoryModel
          .findOne({ name: trimmedCategory })
          .select('_id')
          .lean();

        resolvedCategory = matchedCategory?._id ?? product.category;
      }
    } else if (incomingCategory) {
      resolvedCategory = incomingCategory;
    }

    newProductDetails = {
      ...cleanProductData,
      ...newProductDetails,
      category: resolvedCategory,
      version: 'v2',
    };

    const updatedProduct: ProductDocument =
      await this.productModel.findByIdAndUpdate(product.id, newProductDetails, {
        new: true,
      });
    const priceKeys = [
      'actualPrice',
      'discountPrice',
      'totalPrice',
      'marketPrice',
    ];

    const priceChanges = {};

    priceKeys.forEach((key) => {
      if (key in newProductDetails && product[key] !== newProductDetails[key]) {
        priceChanges[key] = {
          old: product[key],
          new: newProductDetails[key],
        };
      }
    });

    const hasPriceChanges = Object.keys(priceChanges).length > 0;

    const activityMetadata = {
      priceChange: hasPriceChanges,
      priceChanges,
      newProductDetails,
    };

    let description = `Update product - Name: ${newProductDetails.name}`;

    if (hasPriceChanges) {
      const updatedPrices = Object.entries(priceChanges)
        .map(([key, value]) => `Update product ${key} to ₦${value['new']}`)
        .join('; ');
      description = updatedPrices;
    }

    const activityLog: IActivityLog = {
      objectId: productId,
      description,
      initiator: null,
      initiatorType: INITIATOR_TYPE.ADMIN,
      metadata: activityMetadata,
      action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
      module: Product.name,
    };
    await this.activityLogModel.create(activityLog);

    if (updatedProduct) {
      const syncedProduct = await this.syncProductDerivedFieldsAfterSave(updatedProduct);

      await this.invalidateProductListCaches();

      // Heal past PAID orders that were snapshotted with no cost (₦0 profit)
      // whenever the product now carries a market price. Keyed on the price
      // being present — not just changed — so re-saving an already-priced
      // product also back-fills historical orders. Runs in the background so
      // the product save stays fast; recompute is a no-op when nothing needs it.
      if (Number((updatedProduct as { marketPrice?: unknown }).marketPrice) > 0) {
        void this.recomputeOrderCogsForProduct(productId).catch((error) => {
          console.error(
            `Failed to recompute order COGS for product ${productId}:`,
            error,
          );
        });
      }

      return {
        status: true,
        message: 'Product updated successfully',
        data: syncedProduct,
      };
    }
  }

  /**
   * Recompute COGS snapshots for a single order's lines. Only lines that lack a
   * valid snapshot are recomputed (using the live product cost) — already
   * verified lines keep their point-in-time snapshot. The order must be loaded
   * with `products.product` / `additionalProducts.product` populated so cost can
   * be resolved from the current product. Returns the new line arrays plus
   * whether anything actually changed. Product refs are re-persisted as ids.
   */
  private applyOrderCogsRecompute(order: any): {
    changed: boolean;
    products: any[] | undefined;
    additionalProducts: any[] | undefined;
  } {
    let changed = false;

    const recompute = (lines: any[] | undefined): any[] | undefined => {
      if (!Array.isArray(lines) || lines.length === 0) {
        return lines;
      }

      const resnapped = snapshotOrderFinancialLines(
        lines as any[],
        order?.business,
        order?.discount,
      );

      return lines.map((source, index) => {
        const original =
          typeof source?.toObject === 'function' ? source.toObject() : { ...source };
        const alreadyValid =
          Number(original.financialSnapshotVersion) >=
          ORDER_FINANCIAL_SNAPSHOT_VERSION;
        const recomputedNowValid =
          Number(resnapped[index]?.financialSnapshotVersion) >=
          ORDER_FINANCIAL_SNAPSHOT_VERSION;

        const line =
          !alreadyValid && recomputedNowValid ? resnapped[index] : original;
        if (!alreadyValid && recomputedNowValid) {
          changed = true;
        }

        // Persist the product as an id ref, never the populated document.
        const product = (line as any).product;
        if (product && typeof product === 'object' && product._id) {
          (line as any).product = product._id;
        }
        return line;
      });
    };

    return {
      changed,
      products: recompute(order?.products),
      additionalProducts: recompute(order?.additionalProducts),
    };
  }

  /**
   * Back-fill COGS snapshots for PAID orders that contain this product but were
   * snapshotted without a cost (e.g. the product had no market price at sale
   * time, so the order reported ₦0 profit).
   */
  private async recomputeOrderCogsForProduct(productId: string): Promise<void> {
    let productObjectId: Types.ObjectId;
    try {
      productObjectId = new Types.ObjectId(productId);
    } catch {
      return;
    }

    const orders = await this.orderModel
      .find({
        paymentStatus: ORDER_PAYMENT_STATUS.PAID,
        status: {
          $nin: [
            ORDER_STATUS.CANCELLED,
            ORDER_STATUS.RETURNED,
            ORDER_STATUS.REFUNDED,
          ],
        },
        $or: [
          { 'products.product': productObjectId },
          { 'additionalProducts.product': productObjectId },
        ],
      })
      .populate('products.product')
      .populate('additionalProducts.product')
      .exec();

    for (const order of orders) {
      const { changed, products, additionalProducts } =
        this.applyOrderCogsRecompute(order);
      if (changed) {
        await this.orderModel.updateOne(
          { _id: order._id },
          { $set: { products, additionalProducts } },
        );
      }
    }
  }

  /**
   * One-time-ish healer: on startup, back-fill COGS snapshots for every PAID
   * order that still has a line without a current snapshot (e.g. orders taken
   * before a product's market price was set). Self-limiting — once a line is
   * snapshotted it no longer matches the filter, so healed orders are skipped on
   * subsequent boots. Runs detached so it never blocks startup.
   */
  private async backfillUnverifiedOrderCogs(): Promise<void> {
    const unverifiedLine = {
      $elemMatch: {
        $or: [
          { financialSnapshotVersion: { $exists: false } },
          { financialSnapshotVersion: { $lt: ORDER_FINANCIAL_SNAPSHOT_VERSION } },
        ],
      },
    };

    const cursor = this.orderModel
      .find({
        paymentStatus: ORDER_PAYMENT_STATUS.PAID,
        status: {
          $nin: [
            ORDER_STATUS.CANCELLED,
            ORDER_STATUS.RETURNED,
            ORDER_STATUS.REFUNDED,
          ],
        },
        $or: [
          { products: unverifiedLine },
          { additionalProducts: unverifiedLine },
        ],
      })
      .populate('products.product')
      .populate('additionalProducts.product')
      .cursor();

    let healed = 0;
    for await (const order of cursor) {
      const { changed, products, additionalProducts } =
        this.applyOrderCogsRecompute(order);
      if (changed) {
        await this.orderModel.updateOne(
          { _id: order._id },
          { $set: { products, additionalProducts } },
        );
        healed += 1;
      }
    }

    if (healed > 0) {
      console.log(`Back-filled COGS snapshots for ${healed} PAID order(s).`);
    }
  }

  onApplicationBootstrap(): void {
    // Heal historical orders whose cost was fixed after the sale. Detached so a
    // slow scan never delays the API coming up.
    void this.backfillUnverifiedOrderCogs().catch((error) => {
      console.error('COGS backfill on startup failed:', error);
    });
  }

  /**
   * Get all products.
   *
   * @returns {object}
   */
  async getProducts(): Promise<any> {
    const cacheKey = 'all_products_sorted';

    // Try to retrieve the cached products
    let productsWithParsedUnits: ProductDocument[] =
      await this.cacheManager.get<ProductDocument[]>(cacheKey);

    if (!productsWithParsedUnits) {
      // If not found in cache, query the database
      const products: ProductDocument[] = await this.productModel
        .find()
        .sort({ createdAt: -1 })
        .exec();

      productsWithParsedUnits = products.map((product) => {
        if (product.version === 'v2') {
          product.unit = JSON.parse(product.unit);
        }
        return product;
      });

      // Cache the result
      await this.cacheManager.set(cacheKey, productsWithParsedUnits, {
        ttl: 86400,
      });
    }

    return {
      status: true,
      message: 'Products fetched successfully',
      data: productsWithParsedUnits,
    };
  }

  /**
   * Product.category is Mixed (Category ObjectId or legacy name string).
   * Resolve ObjectId refs to `{ _id, name }` for admin UI; leave name strings as-is.
   */
  private async enrichProductCategories(
    products: Array<{ category?: unknown }>,
  ): Promise<void> {
    const categoryIds = [
      ...new Set(
        products
          .map((product) => this.resolveCategoryObjectId(product.category))
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    if (categoryIds.length === 0) {
      return;
    }

    const categories = await this.categoryModel
      .find({ _id: { $in: categoryIds.map((id) => new Types.ObjectId(id)) } })
      .select('name _id')
      .lean()
      .exec();

    const categoriesById = new Map(
      categories.map((category) => [String(category._id), category]),
    );

    for (const product of products) {
      const categoryId = this.resolveCategoryObjectId(product.category);
      if (!categoryId) {
        continue;
      }

      const resolved = categoriesById.get(categoryId);
      if (resolved) {
        product.category = {
          _id: String(resolved._id),
          name: resolved.name,
        };
      }
    }
  }

  private resolveCategoryObjectId(category: unknown): string | null {
    if (!category) {
      return null;
    }

    if (category instanceof Types.ObjectId) {
      return String(category);
    }

    if (typeof category === 'object') {
      if ('name' in category && '_id' in category) {
        return this.resolveCategoryObjectId((category as { _id: unknown })._id);
      }

      if ('_id' in category) {
        return this.resolveCategoryObjectId((category as { _id: unknown })._id);
      }

      return null;
    }

    if (typeof category === 'string') {
      try {
        const objectId = new Types.ObjectId(category);
        return String(objectId) === category ? category : null;
      } catch {
        return null;
      }
    }

    return null;
  }

  private async repairProductDerivedFieldsIfStale<T extends Record<string, any>>(
    products: T[],
  ): Promise<T[]> {
    if (products.length === 0) {
      return products;
    }

    let repairedAny = false;

    const repairs = await Promise.all(
      products.map(async (product) => {
        const patch = {
          ...buildPromotionDiscountPatch(product),
          ...buildLowStockPatch(product),
        };

        if (Object.keys(patch).length === 0) {
          return product;
        }

        repairedAny = true;
        await this.productModel.findByIdAndUpdate(product._id, patch);
        return { ...product, ...patch };
      }),
    );

    if (repairedAny) {
      await this.invalidateProductListCaches();
    }

    return repairs;
  }

  private async syncProductDerivedFieldsAfterSave(
    product: ProductDocument,
  ): Promise<ProductDocument> {
    const patch = {
      ...buildExpectedPromotionDiscount(product),
      ...buildLowStockPatch(product),
    };

    if (Object.keys(patch).length === 0) {
      return product;
    }

    const updatedProduct = await this.productModel.findByIdAndUpdate(
      product._id,
      patch,
      { new: true },
    );

    return updatedProduct ?? product;
  }

  private async invalidateProductListCaches() {
    await this.cacheManager.del('all_products_sorted');
    await this.cacheManager.del('categories_with_products');
  }

  /**
   * Get filtered orders with pagination
   */
  async getFilteredProducts(query: OrderFilterParams) {
    const {
      amountFrom,
      amountTo,
      productStatus,
      startDate,
      endDate,
      unit,
      inStock,
      name,
      category,
      trackQuantity,
      page = 1,
      limit = 10,
    } = query;

    const filters: OrderFilterParams = {
      amountFrom,
      amountTo,
      startDate,
      endDate,
      unit,
      inStock,
      name,
      category,
      productStatus,
      trackQuantity,
    };

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key],
    );

    // Validate filters
    const validation = ProductFilterUtil.validateFilters(filters);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid filters: ${validation.errors.join(', ')}`,
      );
    }

    // Build the query filter
    const filterQuery = ProductFilterUtil.buildFilterQuery(filters);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Do not use populate — Mixed category values include legacy name strings (see enrichProductCategories).
    const [products, total] = await Promise.all([
      this.productModel
        .find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(filterQuery).exec(),
    ]);

    await this.enrichProductCategories(products);
    const repairedProducts = await this.repairProductDerivedFieldsIfStale(products);

    return {
      status: true,
      message: 'Products fetched successfully',
      data: {
        products: repairedProducts,
        meta: {
          totalDocuments: total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    };
  }

  /**
   * Get a single product.
   *
   * @param productId
   * @returns
   */
  async getSingleProduct(productId: string): Promise<any> {
    const product = await this.productModel.findById(productId).lean();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [repairedProduct] = await this.repairProductDerivedFieldsIfStale([product]);

    await this.enrichProductCategories([repairedProduct]);

    if (repairedProduct.version === 'v2') {
      repairedProduct.unit = JSON.parse(repairedProduct.unit);
    }

    const productActivities = await this.activityLogModel
      .find({
        objectId: productId,
      })
      .sort({ createdAt: -1 })
      .limit(30);

    return {
      status: true,
      message: 'Product fetched succesfully',
      data: { ...repairedProduct, activities: productActivities },
    };
  }

  /**
   * Add stock.
   *
   * @param productData
   * @param productId
   * @returns {object}
   */
  async addBatchProduct(
    productData: CreateBatchProductDto,
    productId: string,
  ): Promise<any> {
    // Find product and include customer details
    const product: ProductDocument = await this.productModel.findOne({
      _id: productId,
    });

    // Throw error if product not found
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const nextUnitPrice = Number(productData.unitPrice);
    const nextQuantity = Number(productData.quantity);
    const nextPurchaseUnit =
      typeof productData.unit === 'string' ? productData.unit.trim().toLowerCase() : '';

    // Calculate total price for new batch
    const price = nextQuantity * nextUnitPrice;

    const updatePayload: Record<string, unknown> = {
      $inc: {
        quantity: nextQuantity,
        totalPrice: price,
      },
    };

    // Keep edit form values in sync with add-stock inputs.
    if (Number.isFinite(nextUnitPrice) && nextUnitPrice > 0) {
      updatePayload.$set = {
        marketPrice: nextUnitPrice,
      };
    }

    if (nextPurchaseUnit) {
      updatePayload.$set = {
        ...(updatePayload.$set as Record<string, unknown> | undefined),
        purchaseUnit: nextPurchaseUnit,
      };
    }

    // Update product atomically with incremented quantity and price
    const updatedProduct: ProductDocument =
      await this.productModel.findByIdAndUpdate(
        productId,
        updatePayload,
        {
          new: true,
        },
      );

    // Return success response with updated product
    if (updatedProduct) {
      await this.cacheManager.del('all_products_sorted');
      await this.cacheManager.del('categories_with_products');

      const unitPrice = createMoney(+productData.unitPrice, 'naira').format();

      const description = `Add batch product - Name: ${updatedProduct.name}, Quantity: ${productData.quantity}, Unit Price: ${unitPrice}. Remaining ${updatedProduct.quantity} quantity.`;

      this.eventEmitter.emit(
        'product.stock.updated',
        new ProductStockUpdatedEvent(
          updatedProduct,
          productData.quantity,
          'ADDITION',
          'RESTOCK',
          description,
          description,
        ),
      );

      return successResponse(
        'Product batch added successfully',
        updatedProduct,
      );
    }
  }

  /**
   * Deduct batch.
   *
   * @param productData
   * @param productId
   * @returns {object}
   */
  async deductBatchProduct(
    productData: DeductBatchProductDto,
    productId: string,
  ): Promise<any> {
    const { deductReason } = productData;
    // Find product and include customer details
    const product: ProductDocument = await this.productModel.findOne({
      _id: productId,
    });

    // Throw error if product not found
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (+product.quantity < +productData.quantity) {
      throw new BadRequestException('Insufficient quantity');
    }

    // Calculate total price reduction
    const price = +productData.quantity * +product.marketPrice;

    // Update product atomically with decremented quantity and price
    const updatedProduct: ProductDocument =
      await this.productModel.findByIdAndUpdate(
        productId,
        {
          $inc: {
            quantity: -productData.quantity,
            totalPrice: -price,
          },
        },
        {
          new: true,
        },
      );

    // Return success response with updated product
    if (updatedProduct) {
      const movementDescription = `Deduct batch product - Name: ${updatedProduct.name}, Quantity: ${productData.quantity}`;
      const activityLogDescription = `Deduct batch product - Name: ${updatedProduct.name}, Quantity: ${productData.quantity}, Market Price: ₦${updatedProduct.marketPrice}, Reason: ${deductReason}. Remaining ${updatedProduct.quantity} quantity.`;

      this.eventEmitter.emit(
        'product.stock.updated',
        new ProductStockUpdatedEvent(
          updatedProduct,
          -productData.quantity,
          'DEDUCTION',
          'RESTOCK',
          movementDescription,
          activityLogDescription,
        ),
      );

      // Return success response
      return successResponse('Product deducted successfully', updatedProduct);
    }
  }

  /**
   * Sets a product as in stock.
   * @param productId The ID of the product to update.
   * @returns The updated product details.
   */
  async setProductInStock(productId: string): Promise<any> {
    const product: ProductDocument =
      await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.inStock) {
      throw new BadRequestException('Product is already in stock');
    }

    const updatedProduct: ProductDocument =
      await this.productModel.findByIdAndUpdate(
        productId,
        { inStock: true },
        { new: true },
      );

    if (updatedProduct) {
      await this.cacheManager.del('all_products_sorted');
      await this.cacheManager.del('categories_with_products');
      return successResponse('Product is now in stock', updatedProduct);
    }
  }

  /**
   * Sets a product as out of stock.
   * @param productId The ID of the product to update.
   * @returns The updated product details.
   * @throws NotFoundException if the product does not exist.
   * @throws BadRequestException if the product is already out of stock.
   */
  async setProductOutOfStock(productId: string): Promise<any> {
    const product: ProductDocument =
      await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.inStock) {
      throw new BadRequestException('Product is already out of stock');
    }

    const updatedProduct: ProductDocument =
      await this.productModel.findByIdAndUpdate(
        productId,
        { inStock: false },
        { new: true },
      );

    if (updatedProduct) {
      await this.cacheManager.del('all_products_sorted');
      await this.cacheManager.del('categories_with_products');
      return successResponse('Product is now out of stock', updatedProduct);
    }
  }

  /**
   * Deactivates a product with transaction and optimistic locking support
   * @param {string} productId - ID of product to deactivate
   * @param {Object} customer - Customer details for authorization
   * @returns {Promise<any>} Deactivated product details
   * @throws {NotFoundException} When product not found
   * @throws {Error} When concurrent update detected
   */
  async deactivateItem(productId: string): Promise<any> {
    // Start transaction session
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Verify product exists and belongs to customer
      const product: ProductDocument = await this.productModel
        .findOne({
          _id: productId,
        })
        .session(session);

      if (!product) {
        throw new NotFoundException('Product not found or already deactivated');
      }

      // Update with optimistic locking
      const deactivatedProduct = await this.productModel.findOneAndUpdate(
        {
          _id: productId,
        },
        {
          $set: { active: false },
        },
        {
          new: true,
          session,
        },
      );

      if (!deactivatedProduct) {
        throw new BadRequestException(
          'Concurrent update detected. Please try again.',
        );
      }

      // Commit transaction
      await session.commitTransaction();

      await this.cacheManager.del('all_products_sorted');
      await this.cacheManager.del('categories_with_products');

      return successResponse(
        'Product deactivated successfully',
        deactivatedProduct,
      );
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw new HttpException(error.response, error.status);
    } finally {
      // Always end session
      session.endSession();
    }
  }

  /**
   * Activates a product with transaction and optimistic locking support
   * @param {string} productId - ID of product to activate
   * @param {Object} customer - Customer details for authorization
   * @returns {Promise<any>} Activated product details
   * @throws {NotFoundException} When product not found
   * @throws {Error} When concurrent update detected
   */
  async activateItem(productId: string): Promise<any> {
    // Start transaction session
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Verify product exists and belongs to customer
      const product: ProductDocument = await this.productModel
        .findOne({
          _id: productId,
        })
        .session(session);

      if (!product) {
        throw new NotFoundException('Product not found or already active');
      }

      // Update with optimistic locking
      const activatedProduct = await this.productModel.findOneAndUpdate(
        {
          _id: productId,
        },
        {
          $set: { active: true },
        },
        {
          new: true,
          session,
        },
      );

      if (!activatedProduct) {
        throw new BadRequestException(
          'Concurrent update detected. Please try again.',
        );
      }

      // Commit transaction
      await session.commitTransaction();

      await this.cacheManager.del('all_products_sorted');
      await this.cacheManager.del('categories_with_products');

      return successResponse(
        'Product activated successfully',
        activatedProduct,
      );
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw new HttpException(error.response, error.status);
    } finally {
      // Always end session
      session.endSession();
    }
  }

  async getBestSellingItems(query: DateFilterDto) {
    const {
      startDate,
      endDate,
      filterType,
      limit = 10,
      page = 1,
      sortOrder = 'desc',
    } = query;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const safeLimit = Math.max(1, Number(limit) || 10);
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;
    const customDateRange =
      startDate && endDate
        ? { start: parseISO(startDate), end: parseISO(endDate) }
        : undefined;

    const dateFilter = getDateFilter(filterType, customDateRange);

    // Build match stage for aggregation pipeline
    const matchStage: any = {
      ...dateFilter,
      status: {
        $nin: ['cancelled'],
      },
    };

    const pipeline: any[] = [
      // Match orders within date range and not cancelled
      {
        $match: matchStage,
      },

      // Unwind products array to work with individual items
      {
        $unwind: '$products',
      },

      // Group by product and calculate sales metrics
      {
        $group: {
          _id: '$products.product',
          totalQuantitySold: {
            $sum: '$products.quantity',
          },
          totalRevenue: {
            $sum: '$products.totalPrice',
          },
          totalOrders: {
            $sum: 1,
          },
          averageOrderValue: {
            $avg: '$products.totalPrice',
          },
          // Keep product details for reference
          productDetails: {
            $first: '$products.cartProduct',
          },
          // The unit the product was ordered in (e.g. "pack"), so the price
          // column can show the price of that unit, not the cheapest one.
          soldUnit: {
            $first: '$products.unit',
          },
        },
      },

      // Populate product information if not available in cartProduct
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo',
        },
      },

      // Add computed fields and merge product info. Use the authoritative
      // looked-up product as the base (so v2 fields like the `unit` price map
      // are always present) and overlay the cart snapshot where available.
      {
        $addFields: {
          product: {
            $mergeObjects: [
              { $arrayElemAt: ['$productInfo', 0] },
              { $ifNull: ['$productDetails', {}] },
            ],
          },
          averageQuantityPerOrder: {
            $divide: ['$totalQuantitySold', '$totalOrders'],
          },
        },
      },

      {
        $sort: {
          totalQuantitySold: sortDirection,
          totalRevenue: sortDirection,
        },
      },
      {
        $facet: {
          meta: [{ $count: 'total' }],
          items: [
            { $skip: skip },
            { $limit: safeLimit },
            {
              $project: {
                _id: 1,
                product: {
                  _id: 1,
                  name: 1,
                  description: 1,
                  actualPrice: 1,
                  discountPrice: 1,
                  unit: 1,
                  discountedUnit: 1,
                  brand: 1,
                  images: 1,
                  slug: 1,
                  category: 1,
                },
                soldUnit: 1,
                totalQuantitySold: 1,
                totalRevenue: 1,
                totalOrders: 1,
                averageOrderValue: {
                  $round: ['$averageOrderValue', 2],
                },
                averageQuantityPerOrder: {
                  $round: ['$averageQuantityPerOrder', 2],
                },
              },
            },
          ],
        },
      },
    ];

    const [aggregation] = await this.orderModel.aggregate(pipeline);
    const total = aggregation?.meta?.[0]?.total ?? 0;
    const bestSellingItems = aggregation?.items ?? [];
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return {
      topBestSellers: bestSellingItems,
      count: bestSellingItems.length,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
      },
      dateRange: {
        startDate,
        endDate,
        filterType,
      },
    };
  }

  async getInventoryMovements(query: DateFilterDto): Promise<any> {
    const {
      productId,
      startDate,
      endDate,
      filterType,
      limit = 20,
      page = 1,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    // Build date filter
    const customDateRange =
      startDate && endDate
        ? { start: parseISO(startDate), end: parseISO(endDate) }
        : undefined;

    const dateFilter = getDateFilter(filterType, customDateRange);

    // Build match criteria for initial product filtering
    const matchCriteria: any = {
      // Get products that have tracking enabled
      trackQuantity: true,
    };

    // Add product-specific filter if provided
    if (productId) {
      matchCriteria['_id'] = new mongoose.Types.ObjectId(productId);
    }

    // Add search filter for product name
    if (search) {
      matchCriteria['name'] = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    // Build sort criteria
    const sortCriteria: any = {};
    switch (sortBy) {
      case 'name':
        sortCriteria['name'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'openingQuantity':
        sortCriteria['openingQuantity'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'closingQuantity':
        sortCriteria['closingQuantity'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'addedQuantity':
        sortCriteria['addedQuantity'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'deductedQuantity':
        sortCriteria['deductedQuantity'] = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sortCriteria['name'] = 1;
    }

    const pipeline: any[] = [
      // Match products based on filters
      {
        $match: matchCriteria,
      },

      // Lookup all inventory movements for each product
      {
        $lookup: {
          from: 'inventorymovements',
          let: {
            productId: '$_id',
            branchId: '$branch',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    // Match date range
                    ...(dateFilter?.createdAt
                      ? [
                          {
                            $gte: ['$movementDate', dateFilter.createdAt.$gte],
                          },
                          {
                            $lte: ['$movementDate', dateFilter.createdAt.$lte],
                          },
                        ]
                      : []),
                  ],
                },
              },
            },
            {
              $sort: { movementDate: 1 },
            },
          ],
          as: 'movements',
        },
      },

      // Calculate opening quantity (quantity before the first movement in date range)
      {
        $addFields: {
          openingQuantity: {
            $subtract: [
              '$quantity',
              {
                $sum: {
                  $map: {
                    input: '$movements',
                    as: 'movement',
                    in: {
                      $cond: {
                        if: {
                          $in: [
                            '$$movement.movementType',
                            [
                              'ADDITION',
                              'TRANSFER_IN',
                              'STOCK_ADJUSTMENT_INCREASE',
                            ],
                          ],
                        },
                        then: '$$movement.quantity',
                        else: { $multiply: ['$$movement.quantity', -1] },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },

      // Calculate totals and sort
      {
        $addFields: {
          addedQuantity: {
            $sum: {
              $map: {
                input: '$movements',
                as: 'movement',
                in: {
                  $cond: {
                    if: {
                      $in: [
                        '$$movement.movementType',
                        [
                          'ADDITION',
                          'TRANSFER_IN',
                          'STOCK_ADJUSTMENT_INCREASE',
                        ],
                      ],
                    },
                    then: '$$movement.quantity',
                    else: 0,
                  },
                },
              },
            },
          },
          deductedQuantity: {
            $sum: {
              $map: {
                input: '$movements',
                as: 'movement',
                in: {
                  $cond: {
                    if: {
                      $in: [
                        '$$movement.movementType',
                        [
                          'DEDUCTION',
                          'SALE',
                          'TRANSFER_OUT',
                          'STOCK_ADJUSTMENT_DECREASE',
                        ],
                      ],
                    },
                    then: '$$movement.quantity',
                    else: 0,
                  },
                },
              },
            },
          },
          closingQuantity: {
            $cond: {
              if: { $gt: [{ $size: '$movements' }, 0] },
              then: { $arrayElemAt: ['$movements.runningBalance', -1] },
              else: '$quantity',
            },
          },
        },
      },

      // Sort based on criteria
      {
        $sort: sortCriteria,
      },

      // Project final structure
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$name',
          unit: '$purchaseUnit',
          openingQuantity: 1,
          addedQuantity: 1,
          deductedQuantity: 1,
          closingQuantity: 1,
          isLowStock: {
            $cond: {
              if: {
                $and: [
                  { $ne: [{ $ifNull: ['$trackQuantity', true] }, false] },
                  { $ne: ['$lowStockLevel', null] },
                  { $lte: ['$closingQuantity', '$lowStockLevel'] },
                ],
              },
              then: true,
              else: false,
            },
          },
          lowStockLevel: 1,
          movements: {
            $map: {
              input: '$movements',
              as: 'movement',
              in: {
                date: '$$movement.movementDate',
                type: '$$movement.movementType',
                quantity: '$$movement.quantity',
                unit: '$$movement.unit',
                reference: '$$movement.reference',
                description: '$$movement.description',
                relatedDocumentId: '$$movement.relatedDocumentId',
              },
            },
          },
        },
      },
    ];

    // Execute main pipeline with pagination
    const [inventoryData, totalCountResult] = await Promise.all([
      this.productModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]),
      this.productModel.aggregate([
        ...pipeline.slice(0, -2), // Remove sort and pagination for count
        { $count: 'total' },
      ]),
    ]);

    // Calculate summary totals for all products (not just the current page)
    const summaryPipeline = [
      ...pipeline.slice(0, -2), // Remove sort and pagination
      {
        $group: {
          _id: null,
          totalOpeningQuantity: { $sum: '$openingQuantity' },
          totalAddedQuantity: { $sum: '$addedQuantity' },
          totalDeductedQuantity: { $sum: '$deductedQuantity' },
          totalClosingQuantity: { $sum: '$closingQuantity' },
          totalProducts: { $sum: 1 },
          totalLowStockItems: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$trackQuantity', true] }, false] },
                    { $ne: ['$lowStockLevel', null] },
                    { $lte: ['$closingQuantity', '$lowStockLevel'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    const summaryResult = await this.productModel.aggregate(summaryPipeline);

    const totalItems = totalCountResult[0]?.total || 0;
    const totalPages = Math.ceil(totalItems / limit);
    const summary = summaryResult[0] || {
      totalOpeningQuantity: 0,
      totalAddedQuantity: 0,
      totalDeductedQuantity: 0,
      totalClosingQuantity: 0,
      totalProducts: 0,
      totalLowStockItems: 0,
    };

    return successResponse('Inventory movement fetched successfully', {
      data: inventoryData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      summary: {
        totalOpeningQuantity: summary.totalOpeningQuantity,
        totalAddedQuantity: summary.totalAddedQuantity,
        totalDeductedQuantity: summary.totalDeductedQuantity,
        totalClosingQuantity: summary.totalClosingQuantity,
        totalProducts: summary.totalProducts,
        totalLowStockItems: summary.totalLowStockItems,
      },
    });
  }

  async getStockCounts(query: QueryFilterDto): Promise<any> {
    const { limit = 20, page = 1 } = query;
    const skip = (page - 1) * limit;

    const [stockCounts, totalResult] = await Promise.all([
      this.stockCountModel.aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },

        // Populate initiator
        {
          $lookup: {
            from: 'adminusers',
            localField: 'initiator',
            foreignField: '_id',
            as: 'initiator',
          },
        },
        { $unwind: { path: '$initiator', preserveNullAndEmptyArrays: true } },

        // Populate countedProducts.productId
        {
          $lookup: {
            from: 'products',
            localField: 'countedProducts.productId',
            foreignField: '_id',
            as: 'productsData',
          },
        },

        {
          $addFields: {
            countedProducts: {
              $map: {
                input: '$countedProducts',
                as: 'cp',
                in: {
                  $mergeObjects: [
                    '$$cp',
                    {
                      product: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$productsData',
                              as: 'prod',
                              cond: { $eq: ['$$prod._id', '$$cp.productId'] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },

        { $project: { productsData: 0 } },
      ]),
      this.stockCountModel.countDocuments().exec(),
    ]);

    const total = totalResult;
    const totalPages = Math.ceil(total / limit);

    return successResponse('Stock counts fetched successfully', {
      stockCounts,
      meta: {
        totalDocuments: total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  }

  async getSingleStockCount(stockCountId: string): Promise<any> {
    const result = await this.stockCountModel.aggregate([
      { $match: { _id: new Types.ObjectId(stockCountId) } },

      // Populate initiator
      {
        $lookup: {
          from: 'adminusers',
          localField: 'initiator',
          foreignField: '_id',
          as: 'initiator',
        },
      },
      { $unwind: { path: '$initiator', preserveNullAndEmptyArrays: true } },

      // Populate countedProducts.productId
      {
        $lookup: {
          from: 'products',
          localField: 'countedProducts.productId',
          foreignField: '_id',
          as: 'productsData',
        },
      },

      {
        $addFields: {
          countedProducts: {
            $map: {
              input: '$countedProducts',
              as: 'cp',
              in: {
                $mergeObjects: [
                  '$$cp',
                  {
                    product: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$productsData',
                            as: 'prod',
                            cond: { $eq: ['$$prod._id', '$$cp.productId'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },

      { $project: { productsData: 0 } },
    ]);

    if (!result || result.length === 0) {
      throw new NotFoundException('Stock count record not found');
    }

    return successResponse(
      'Stock count record fetched successfully',
      result[0],
    );
  }

  async addStockCount(initiator: string, stockCountData: CreateStockCountDto) {
    const newCountedProducts = [];

    // Map to promises for concurrent execution
    const promises = stockCountData.countedProducts.map(async (entry) => {
      const { productId, countedQuantity } = entry;

      const product = await this.productModel.findById(productId);
      if (!product) {
        return; // Skip if product not found
      }

      if (!product.trackQuantity) {
        return; // Skip if product does not track quantity
      }

      // Add to countedProducts for StockCount record
      newCountedProducts.push({
        productId,
        originalQuantity: product.quantity,
        countedQuantity,
        unit: product.purchaseUnit,
        price: product.marketPrice,
      });

      const quantityDifference = countedQuantity - product.quantity;

      if (quantityDifference === 0) {
        return;
      }

      const movementType =
        quantityDifference > 0
          ? 'STOCK_ADJUSTMENT_INCREASE'
          : 'STOCK_ADJUSTMENT_DECREASE';

      // Update the product's quantity atomically
      const updatedProduct = await this.productModel.findByIdAndUpdate(
        productId,
        { $set: { quantity: countedQuantity } },
        { new: true },
      );

      if (updatedProduct) {
        const description = `Stock count adjustment - Previous Quantity: ${product.quantity}, Counted Quantity: ${countedQuantity}`;
        // Emit event for stock adjustment
        this.eventEmitter.emit(
          'product.stock.updated',
          new ProductStockUpdatedEvent(
            updatedProduct,
            quantityDifference,
            movementType,
            'STOCK_COUNT_ADJUSTMENT',
            description,
            description,
          ),
        );
      }
    });

    // Wait for all product updates to complete
    await Promise.all(promises);

    const stockCount = await this.stockCountModel.create({
      notes: stockCountData.notes,
      initiator: initiator,
      countedProducts: newCountedProducts,
    });

    await stockCount.save();
    return successResponse(
      'Stock count adjustments processed successfully',
      stockCount,
    );
  }
}
