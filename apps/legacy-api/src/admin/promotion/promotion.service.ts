import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreatePromotionDto,
  PromotionFilterParams,
  UpdatePromotionDto,
} from './dto/promotion.dto';
import { Promotion } from '../../promotion/schemas/promotion.schema';
import { successResponse } from '../../utils/responses';
import { Product } from '../../product/entities/product.entity';
import { Order } from 'src/order/entities/order.entity';
import { Types } from 'mongoose';

@Injectable()
export class PromotionService {
  constructor(
    @InjectModel(Promotion.name) private promotionModel: Model<Promotion>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  async create(body: CreatePromotionDto) {
    const { startDate, endDate, isPercentageDiscounted, discountValue } = body;
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('Start date must be less than end date');
    }

    if (isPercentageDiscounted && discountValue >= 100) {
      throw new BadRequestException('Discount value must be less than 100');
    }

    const createdPromotion = new this.promotionModel({
      ...body,
      isActive: new Date() >= new Date(startDate),
    });
    await createdPromotion.save();

    await this.applyDiscounts(createdPromotion);

    return successResponse('Create promotion successfully', createdPromotion);
  }

  async duplicate(id: string) {
    const existingPromotion = await this.promotionModel.findById(id).lean();

    if (!existingPromotion) {
      throw new NotFoundException('Promotion not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, createdAt, updatedAt, ...rest } = existingPromotion as any;

    const duplicatedPromotion = new this.promotionModel({
      ...rest,
      name: `${existingPromotion.name} (Copy)`,
      isActive: false,
      isDeactivatedManually: false,
    });

    await duplicatedPromotion.save();

    return successResponse(
      'Duplicate promotion successfully',
      duplicatedPromotion,
    );
  }

  async findAll(options: PromotionFilterParams) {
    const { page, limit, status, startDate, endDate, name } = options;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const filter: any = {};

    // Filter by name
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    // Filter by Date Created
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        // Set to end of day if only date is provided
        if (!endDate.includes('T')) {
          end.setHours(23, 59, 59, 999);
        }
        filter.createdAt.$lte = end;
      }
    }

    const statsFilter = { ...filter };

    // Filter by Status (specialize main filter)
    if (status) {
      const now = new Date();
      if (status.includes('active')) {
        filter.isActive = true;
      } else if (status.includes('inactive')) {
        filter.isActive = false;
        filter.endDate = { $gte: now };
      } else if (status.includes('expire')) {
        filter.endDate = { $lt: now };
      }
    }

    const now = new Date();
    const [promotions, total, totalActive, totalInactive, totalExpired] =
      await Promise.all([
        this.promotionModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('products')
          .lean()
          .exec(),
        this.promotionModel.countDocuments(filter),
        this.promotionModel.countDocuments({
          ...statsFilter,
          isActive: true,
          endDate: { $gte: now },
        }),
        this.promotionModel.countDocuments({
          ...statsFilter,
          isActive: false,
          endDate: { $gte: now },
        }),
        this.promotionModel.countDocuments({
          ...statsFilter,
          endDate: { $lt: now },
        }),
      ]);

    const promotionsWithUsage = await Promise.all(
      promotions.map(async (promotion) => {
        const usageCount = await this.getUsageCount(promotion._id.toString());
        return { ...promotion, usageCount };
      }),
    );

    const totalUsage = promotionsWithUsage.reduce(
      (sum, p) => sum + p.usageCount,
      0,
    );

    return successResponse('Get promotions successfully', {
      data: promotionsWithUsage,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      stats: {
        totalActive,
        totalInactive,
        totalExpired,
        usage: totalUsage,
      },
    });
  }

  async findOne(id: string) {
    const promotion = await this.promotionModel
      .findById(id)
      .populate('products')
      .lean()
      .exec();

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    const usageCount = await this.getUsageCount(id);

    return successResponse('Get promotion successfully', {
      ...promotion,
      usageCount,
    });
  }

  async update(id: string, body: UpdatePromotionDto) {
    const { startDate, endDate, isPercentageDiscounted, discountValue } = body;
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('Start date must be less than end date');
    }

    if (
      isPercentageDiscounted !== undefined &&
      discountValue !== undefined &&
      isPercentageDiscounted &&
      discountValue > 100
    ) {
      throw new BadRequestException('Discount value must be less than 100');
    }

    const existingPromotion = await this.promotionModel
      .findById(id)
      .populate('products');

    if (!existingPromotion) {
      throw new NotFoundException('Promotion not found');
    }

    // Revert old discounts
    await this.revertDiscounts(existingPromotion);

    const updatedPromotion = await this.promotionModel
      .findByIdAndUpdate(id, body, { new: true })
      .populate('products')
      .exec();

    // Apply new discounts
    await this.applyDiscounts(updatedPromotion);

    return successResponse('Update promotion successfully', updatedPromotion);
  }

  async remove(id: string) {
    const existingPromotion = await this.promotionModel
      .findById(id)
      .populate('products');

    if (!existingPromotion) {
      throw new NotFoundException('Promotion not found');
    }

    await this.revertDiscounts(existingPromotion);

    await this.promotionModel.findByIdAndDelete(id).exec();
    return successResponse('Delete promotion successfully');
  }

  async activate(id: string) {
    const promotion = await this.promotionModel
      .findById(id)
      .populate('products');

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    const now = new Date();
    if (
      now < new Date(promotion.startDate) ||
      now > new Date(promotion.endDate)
    ) {
      throw new BadRequestException(
        'Cannot activate promotion outside of its valid date range',
      );
    }

    promotion.isActive = true;
    promotion.isDeactivatedManually = false;
    await promotion.save();

    await this.applyDiscounts(promotion);

    return successResponse('Promotion activated successfully', promotion);
  }

  async deactivate(id: string) {
    const promotion = await this.promotionModel
      .findById(id)
      .populate('products');

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    promotion.isActive = false;
    promotion.isDeactivatedManually = true;
    await promotion.save();

    await this.revertDiscounts(promotion);

    return successResponse('Promotion deactivated successfully', promotion);
  }

  private async getUsageCount(promotionId: string): Promise<number> {
    const result = await this.orderModel.aggregate([
      {
        $match: {
          'products.cartProduct.promotion._id': new Types.ObjectId(promotionId),
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);

    return result.length > 0 ? result[0].count : 0;
  }

  async applyDiscounts(promotion: any) {
    if (
      !promotion.isActive ||
      !promotion.products ||
      !promotion.products.length
    ) {
      return;
    }

    for (const productId of promotion.products) {
      const product = await this.productModel.findById(productId);
      if (product) {
        if (promotion.isPercentageDiscounted && promotion.discountValue > 0) {
          if (product.version === 'v2' && product.unit) {
            // Handle V2 Products (Multi-unit)
            try {
              const units = JSON.parse(product.unit);
              const discountedUnits = {};

              for (const [unit, price] of Object.entries(units)) {
                let discountPrice = 0;
                const numericPrice = Number(price);

                if (!isNaN(numericPrice)) {
                  discountPrice =
                    numericPrice -
                    (numericPrice * promotion.discountValue) / 100;
                  // Ensure discount price is not negative
                  discountPrice = Math.max(0, discountPrice);
                  discountedUnits[unit] = discountPrice;
                }
              }

              product.discountedUnit = JSON.stringify(discountedUnits);
            } catch (error) {
              console.error(
                `Error parsing units for product ${product._id}`,
                error,
              );
            }
          } else {
            // Handle V1 Products (Single price)
            let discountPrice = 0;
            discountPrice =
              product.actualPrice -
              (product.actualPrice * promotion.discountValue) / 100;
            // Ensure discount price is not negative
            discountPrice = Math.max(0, discountPrice);
            product.discountPrice = discountPrice;
          }
        }

        product.promotion = {
          _id: promotion._id,
          name: promotion.name,
          slug: promotion.name
            ? promotion.name.toLowerCase().replace(/ /g, '-')
            : '',
          isPercentageDiscounted: promotion.isPercentageDiscounted,
          discountValue: promotion.discountValue,
        };
        await product.save();
      }
    }
  }

  async revertDiscounts(promotion: any) {
    if (!promotion.products || !promotion.products.length) return;

    for (const productId of promotion.products) {
      const id = productId._id || productId;

      const product = await this.productModel.findById(id);
      if (product) {
        if (product.version === 'v2') {
          product.discountedUnit = null;
        } else {
          product.discountPrice = product.actualPrice;
        }

        // Only clear promotion if it matches the one being reverted
        if (product.promotion?._id?.toString() === promotion._id.toString()) {
          product.promotion = null;
        }

        await product.save();
      }
    }
  }
}
