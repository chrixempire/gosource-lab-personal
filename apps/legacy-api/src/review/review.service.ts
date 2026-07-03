import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { paginationUtil } from '../utils/pagination';
import { successResponse } from '../utils/responses';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../business/schema/business.schema';
import { CreateReviewDto } from './dto/review.dto';
import { Review, ReviewDocument } from './schema/review.schema';

type AdminReviewQuery = {
  page?: number;
  limit?: number;
  search?: string;
  rating?: number;
};

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(BusinessCustomer.name)
    private readonly businessModel: Model<BusinessCustomerDocument>,
  ) {}

  async create(dto: CreateReviewDto, business?: any) {
    const businessId =
      business?.id ?? business?._id ?? business?.businessId ?? null;

    let businessName: string | undefined =
      business?.businessName ?? business?.name ?? undefined;
    let email: string | undefined = business?.email ?? undefined;
    if (businessId && Types.ObjectId.isValid(String(businessId))) {
      try {
        const customer = await this.businessModel
          .findById(businessId)
          .select('businessName firstName lastName email')
          .lean();
        if (customer) {
          businessName =
            (customer as any).businessName ||
            `${(customer as any).firstName ?? ''} ${(customer as any).lastName ?? ''}`.trim() ||
            businessName;
          email = (customer as any).email || email;
        }
      } catch {
        /* best-effort name resolution */
      }
    }

    const orderObjId = Types.ObjectId.isValid(dto.orderId)
      ? new Types.ObjectId(dto.orderId)
      : undefined;
    const businessObjId =
      businessId && Types.ObjectId.isValid(String(businessId))
        ? new Types.ObjectId(String(businessId))
        : undefined;

    // One review per order per business — upsert so a re-submit just updates.
    const review = await this.reviewModel.findOneAndUpdate(
      { order: orderObjId, business: businessObjId },
      {
        order: orderObjId,
        business: businessObjId,
        businessName: businessName || undefined,
        email: email || undefined,
        rating: dto.rating,
        comment: dto.comment?.trim(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return successResponse('Review submitted successfully', review);
  }

  async hasReviewed(orderId: string, business?: any) {
    const businessId =
      business?.id ?? business?._id ?? business?.businessId ?? null;
    if (
      !Types.ObjectId.isValid(orderId) ||
      !businessId ||
      !Types.ObjectId.isValid(String(businessId))
    ) {
      return successResponse('Review status fetched', { reviewed: false });
    }
    const exists = await this.reviewModel.exists({
      order: new Types.ObjectId(orderId),
      business: new Types.ObjectId(String(businessId)),
    });
    return successResponse('Review status fetched', { reviewed: Boolean(exists) });
  }

  async findAll(query: AdminReviewQuery) {
    const filter: Record<string, unknown> = {};
    if (query.rating) filter.rating = Number(query.rating);

    const result = await paginationUtil.paginate<ReviewDocument>({
      model: this.reviewModel,
      page: query.page,
      limit: query.limit,
      filter,
      search: query.search?.trim(),
      searchFields: ['comment', 'businessName', 'email'],
      sort: { createdAt: -1 },
      populate: [{ path: 'order', select: 'reference' }],
    });

    return successResponse('Reviews fetched successfully', {
      reviews: result.data,
      meta: result.meta,
    });
  }

  async getStats() {
    const grouped = await this.reviewModel.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let weighted = 0;
    for (const row of grouped) {
      const star = Number(row._id);
      const count = Number(row.count) || 0;
      if (star >= 1 && star <= 5) distribution[star] = count;
      total += count;
      weighted += star * count;
    }
    const average = total > 0 ? Number((weighted / total).toFixed(2)) : 0;

    return successResponse('Review stats fetched successfully', {
      total,
      average,
      distribution,
    });
  }
}
