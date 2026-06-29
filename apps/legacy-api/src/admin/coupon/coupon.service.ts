import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Coupon, CouponDocument } from './schema/coupon.schema';
import { Model } from 'mongoose';
import { QueryParamsDto } from '../../analytics/dto/query-param.dto';
import { ApplyCouponDto, CreateCouponDto } from './dto/create-coupon.dto';
import { RequestDocument, Request } from '../../request/schema/request.schema';
import { CouponType, CouponCategory } from './coupon.enum';
import { Order } from '../../order/entities/order.entity';
import { Product } from '../../product/entities/product.entity';
import { Category } from '../../category/entities/category.entity';
import { calculateTotalPrice, calculateDeliveryFee, calculateFrozenDeliveryFee } from '../../utils/helpers';
import { successResponse } from '../../utils/responses';
import { RequestStatus } from '../../request/enum/request.enum';
import {
  assertCouponCanBeApplied,
  computeDiscountAmount,
  isScopedItemCoupon,
  resolveEligibleSubtotal,
} from './coupon-apply.helpers';
import { ActivityService } from '../../activity/activity.service';
import { adminInitiator } from '../../utils/activity-initiator.util';
import { ACTIVITY_LOG_ACTION_TYPE } from '../../activity/interface/activityLog.interface';
import {
  buildChanges,
  describeChanges,
  formatLogDate,
  formatIdList,
} from '../../utils/activity-changes.util';

// Coupon expiry is stored on `endDate` (what the admin form's "Set expiry
// date" field writes, and what apply-time enforcement reads first via
// `endDate ?? expiryDate`). `expiryDate` is a legacy fallback the UI never
// edits, so track `endDate` here or expiry changes go unrecorded.
// Track every editable field so any change shows up in the audit log.
const COUPON_LOG_FIELDS = [
  { key: 'code', label: 'code' },
  { key: 'title', label: 'title' },
  { key: 'type', label: 'type' },
  { key: 'category', label: 'category' },
  { key: 'target', label: 'target' },
  { key: 'discount', label: 'discount' },
  { key: 'minimumOrderAmount', label: 'minimum order amount' },
  { key: 'usageLimit', label: 'usage limit' },
  { key: 'loyaltyPointsRequired', label: 'loyalty points required' },
  { key: 'startDate', label: 'start date', format: formatLogDate },
  { key: 'endDate', label: 'expiry date', format: formatLogDate },
  { key: 'categoryId', label: 'applicable category', format: formatIdList },
  { key: 'applicableItems', label: 'applicable items', format: formatIdList },
  { key: 'comboItems', label: 'combo items', format: formatIdList },
];

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<Coupon>,
    @InjectModel(Request.name) private requestModel: Model<Request>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    private readonly activityService: ActivityService,
  ) {}

  /**
   * Create a new coupon.
   *
   * @param couponData
   * @returns
   */
  async createCoupon(couponData: CreateCouponDto): Promise<any> {
    const { type, discount } = couponData;
    const coupon: CouponDocument = await this.couponModel.findOne({
      code: couponData.code,
    });

    if (coupon) {
      throw new ConflictException(
        `Coupon with the code ${couponData.code} already exist.`,
      );
    }

    if (type === CouponType.PERCENTAGE && discount === 100) {
      throw new BadRequestException(`You can't create a 100% off discount`);
    }

    const newCoupon = await this.couponModel.create(couponData);

    return {
      status: true,
      message: 'Coupon created successfully',
      data: newCoupon,
    };
  }

  /**
   * Get all coupons.
   *
   * @returns
   */
  async getCoupons(queryParams: QueryParamsDto): Promise<any> {
    const { limit = 200, page = 1, filterBy, filterValue } = queryParams;

    let filter = {};
    if (filterBy && filterValue) {
      filter = { [filterBy]: filterValue };
    }

    const totalDocuments = await this.couponModel.countDocuments(filter).exec();

    const coupons: CouponDocument[] = await this.couponModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      status: true,
      message: 'Coupons fetched successfully',
      data: {
        totalDocuments,
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
        coupons,
      },
    };
  }

  /**
   * Get a single coupon.
   *
   * @param couponId
   * @returns
   */
  async getSingleCoupon(couponId: string): Promise<any> {
    const coupon: CouponDocument = await this.couponModel.findById(couponId);

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      status: true,
      message: 'Coupon fetched successfully',
      data: coupon,
    };
  }

  /**
   * Update coupon.
   *
   * @param couponId
   * @param couponData
   * @returns
   */
  async updateCoupon(
    couponId: string,
    couponData: any,
    admin?: any,
  ): Promise<any> {
    const coupon: CouponDocument = await this.couponModel.findById(couponId);

    if (!coupon) {
      throw new NotFoundException('coupon not found');
    }

    const update = await this.couponModel.findByIdAndUpdate(
      couponId,
      {
        ...couponData,
      },
      { new: true },
    );

    if (update) {
      const changes = buildChanges(
        coupon.toObject() as unknown as Record<string, unknown>,
        update.toObject() as unknown as Record<string, unknown>,
        COUPON_LOG_FIELDS,
      );
      await this.activityService.record({
        ...adminInitiator(admin),
        action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
        module: 'Coupon',
        objectId: couponId,
        description: describeChanges('coupon', coupon.code, changes),
        metadata: { changes, details: await this.buildCouponDetails(update) },
      });

      return {
        status: true,
        message: 'Coupon updated successfully',
        data: update,
      };
    }
  }

  /** Full current-state snapshot of a coupon for the activity-log details. */
  private async buildCouponDetails(
    coupon: any,
  ): Promise<Record<string, unknown>> {
    const applicableItems: any[] = coupon.applicableItems ?? [];
    const productNames = applicableItems.length
      ? (
          await this.productModel
            .find({ _id: { $in: applicableItems } })
            .select('name')
            .lean()
        )
          .map((product: any) => product.name)
          .filter(Boolean)
      : [];
    const categoryName = coupon.categoryId
      ? (
          await this.categoryModel
            .findById(coupon.categoryId)
            .select('name')
            .lean()
        )?.name
      : null;

    return {
      code: coupon.code,
      title: coupon.title,
      type: coupon.type,
      category: coupon.category,
      target: coupon.target,
      discount: coupon.discount,
      status: coupon.isActive ? 'active' : 'inactive',
      'minimum order amount': coupon.minimumOrderAmount,
      'usage limit': coupon.usageLimit,
      'start date': formatLogDate(coupon.startDate),
      'expiry date': formatLogDate(coupon.endDate),
      'applicable category': categoryName ?? '',
      products: productNames.join(', '),
    };
  }

  async removeCoupon(couponId: string): Promise<any> {
    const coupon = await this.couponModel.findOne({
      _id: couponId,
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    await this.couponModel.deleteOne({ _id: couponId });
    return {
      status: true,
      message: 'Coupon deleted successfully',
    };
  }

  private async getBusinessOrderCount(businessId: string): Promise<number> {
    return this.orderModel.countDocuments({
      $or: [{ business: businessId }, { customerId: businessId }],
    });
  }

  private rejectCouponRule(message: string): never {
    throw new BadRequestException(message);
  }

  private async markCouponUsed(coupon: CouponDocument): Promise<void> {
    await this.couponModel.updateOne(
      { _id: coupon._id },
      { $inc: { usageCount: 1 } },
    );
  }

  /**
   * Apply coupon to request.
   *
   * @param couponId
   * @returns
   */
  async applyCoupon(
    requestId: string,
    couponDetail: ApplyCouponDto,
    businessDetails: any,
  ): Promise<any> {
    const coupon: CouponDocument = await this.couponModel.findOne({
      code: couponDetail.code,
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const request: RequestDocument = await this.requestModel
      .findById(requestId)
      .populate('branch');

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.coupon) {
      throw new BadRequestException(
        'A coupon has already been applied to this request',
      );
    }

    const businessId = String(businessDetails.id);
    const cartSubtotal = calculateTotalPrice(request.products, businessId);
    const orderCount = await this.getBusinessOrderCount(
      String(request.branch?.businessId ?? businessId),
    );

    try {
      assertCouponCanBeApplied(coupon, {
        orderCount,
        cartSubtotal,
      });
    } catch (error) {
      this.rejectCouponRule(
        error instanceof Error ? error.message : 'Coupon cannot be applied',
      );
    }

    if (coupon.type === CouponType.FREE_DELIVERY) {
      request.deliveryFee = 0;
      request.couponCode = coupon.code;
      request.coupon = true;
      request.couponDetails = coupon;
      request.discount = 0;
      await request.save();
      await this.markCouponUsed(coupon);

      return {
        status: true,
        message: 'Coupon Applied successfully',
        data: coupon,
      };
    }

    const eligibleSubtotal = resolveEligibleSubtotal(
      coupon,
      request.products,
      businessId,
    );

    if (isScopedItemCoupon(coupon) && eligibleSubtotal <= 0) {
      throw new BadRequestException(
        'This coupon does not apply to any items in your request',
      );
    }

    const discount = computeDiscountAmount(coupon, eligibleSubtotal);
    if (discount <= 0) {
      throw new BadRequestException('Coupon does not apply to this request');
    }

    request.subtotal = cartSubtotal;
    request.couponCode = coupon.code;
    request.coupon = true;
    request.couponDetails = coupon;
    request.discount = discount;
    await request.save();
    await this.markCouponUsed(coupon);

    return {
      status: true,
      message: 'Coupon Applied successfully',
      data: coupon,
    };
  }

  async removeCouponFromRequest(
    requestId: string,
    businessDetails: any,
  ): Promise<any> {
    const request: RequestDocument = await this.requestModel
      .findById(requestId)
      .populate('branch')
      .populate('couponDetails');

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (!request.coupon) {
      throw new BadRequestException('No coupon is applied to this request');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        'Coupon can only be removed from a pending request',
      );
    }

    const businessId = String(businessDetails.id);
    const cartSubtotal = calculateTotalPrice(request.products, businessId);

    let couponDocument =
      request.couponDetails &&
      typeof request.couponDetails === 'object' &&
      ('type' in request.couponDetails || 'category' in request.couponDetails)
        ? (request.couponDetails as CouponDocument)
        : null;

    if (!couponDocument && request.couponCode) {
      couponDocument = await this.couponModel.findOne({ code: request.couponCode });
    }

    const isFreeDelivery =
      couponDocument?.type === CouponType.FREE_DELIVERY ||
      couponDocument?.category === CouponCategory.FREE_DELIVERY ||
      String(couponDocument?.category ?? '') === 'free_delivery';

    if (isFreeDelivery || request.deliveryFee === 0) {
      const frozenFee = calculateFrozenDeliveryFee(request.products, cartSubtotal);
      request.deliveryFee =
        frozenFee > 0 ? frozenFee : calculateDeliveryFee(cartSubtotal);
    }

    request.subtotal = cartSubtotal;
    request.coupon = false;
    request.couponCode = '';
    request.discount = 0;
    request.couponDetails = null;
    await request.save();

    if (couponDocument?._id) {
      await this.couponModel.updateOne(
        { _id: couponDocument._id, usageCount: { $gt: 0 } },
        { $inc: { usageCount: -1 } },
      );
    }

    return successResponse('Coupon removed successfully');
  }

  /**
   * Deactivate discount.
   *
   * @param customer
   * @param discountId
   * @returns {object}
   */
  async deactivateDiscount(discountId: string): Promise<any> {
    const discount: CouponDocument = await this.couponModel.findOne({
      isActive: true,
      _id: discountId,
    });

    if (!discount) {
      throw new BadRequestException('Coupon not found or already deactivated');
    }

    const update = await this.couponModel.findByIdAndUpdate(
      discountId,
      { isActive: false },
      { new: true },
    );

    if (update) {
      return successResponse('Coupon deactivated successfully', update);
    }
  }

  /**
   * Activate discount.
   *
   * @param customer
   * @param discountId
   * @returns {object}
   */
  async activateDiscount(discountId: string): Promise<any> {
    const discount: CouponDocument = await this.couponModel.findOne({
      isActive: false,
      _id: discountId,
    });

    if (!discount) {
      throw new BadRequestException('Discount not found or already activated');
    }

    const update = await this.couponModel.findByIdAndUpdate(
      discountId,
      { isActive: true },
      { new: true },
    );

    if (update) {
      return successResponse('Discount activated successfully', update);
    }
  }
}
