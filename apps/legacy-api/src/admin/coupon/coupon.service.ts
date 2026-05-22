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
import { CouponType } from './coupon.enum';
import { Order } from '../../order/entities/order.entity';
import { calculateTotalPrice } from '../../utils/helpers';
import { successResponse } from '../../utils/responses';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<Coupon>,
    @InjectModel(Request.name) private requestModel: Model<Request>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
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
  async updateCoupon(couponId: string, couponData: any): Promise<any> {
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
      return {
        status: true,
        message: 'Coupon updated successfully',
        data: update,
      };
    }
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

    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      throw new BadRequestException('Coupon has expired');
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

    if (coupon.type === CouponType.FREE_DELIVERY) {
      request.deliveryFee = 0;

      request.couponCode = coupon.code;
      request.coupon = true;
      request.couponDetails = coupon;
      request.discount = request.deliveryFee;
      await request.save();
    } else {
      // Check if first time user
      const orders = await this.orderModel.find({
        customerId: request.branch.businessId,
      });

      if (
        couponDetail.code === 'EASTER5' ||
        couponDetail.code === 'EASTER10' ||
        couponDetail.code === 'WELCOME5'
      ) {
        if (orders.length > 0) {
          throw new BadRequestException(
            'Coupon can only be used by first time users',
          );
        }
      }

      if (
        couponDetail.code === 'GoSource5' ||
        couponDetail.code === 'Gosource5'
      ) {
        if (orders.length > 0) {
          throw new BadRequestException(
            'Coupon can only be used by first time users',
          );
        }
      }

      const subtotal = calculateTotalPrice(
        request.products,
        businessDetails.id,
      );

      if (coupon.type === CouponType.FIXED_AMOUNT) {
        request.subtotal = subtotal - coupon.discount;
      } else if (coupon.type === CouponType.PERCENTAGE) {
        request.subtotal = subtotal - (coupon.discount / 100) * subtotal;
      }

      const deliveryFee = request.deliveryFee;
      request.subtotal += deliveryFee;

      const discount = CouponType.FIXED_AMOUNT
        ? coupon.discount
        : (coupon.discount / 100) * subtotal;

      request.couponCode = coupon.code;
      request.coupon = true;
      request.couponDetails = coupon;
      request.discount = discount;
      await request.save();
    }

    return {
      status: true,
      message: 'Coupon Applied successfully',
      data: coupon,
    };
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
