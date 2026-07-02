import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { paginationUtil } from '../utils/pagination';
import { successResponse } from '../utils/responses';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../business/schema/business.schema';
import { CreateFeedbackDto, UpdateFeedbackStatusDto } from './dto/feedback.dto';
import { FeedbackCategory } from './feedback.enum';
import { Feedback, FeedbackDocument } from './schema/feedback.schema';

type AdminFeedbackQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
};

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
    @InjectModel(BusinessCustomer.name)
    private readonly businessModel: Model<BusinessCustomerDocument>,
  ) {}

  async create(dto: CreateFeedbackDto, business?: any) {
    const businessId =
      business?.id ?? business?._id ?? business?.businessId ?? null;

    // The JWT only carries id/email — resolve the business name from the record.
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

    const feedback = await this.feedbackModel.create({
      message: dto.message.trim(),
      category: dto.category ?? FeedbackCategory.GENERAL,
      rating: dto.rating,
      page: dto.page?.trim(),
      business:
        businessId && Types.ObjectId.isValid(String(businessId))
          ? new Types.ObjectId(String(businessId))
          : undefined,
      businessName: businessName || undefined,
      email: email || undefined,
    });

    return successResponse('Feedback submitted successfully', feedback);
  }

  async findAll(query: AdminFeedbackQuery) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;

    const result = await paginationUtil.paginate<FeedbackDocument>({
      model: this.feedbackModel,
      page: query.page,
      limit: query.limit,
      filter,
      search: query.search?.trim(),
      searchFields: ['message', 'businessName', 'email'],
      sort: { createdAt: -1 },
    });

    return successResponse('Feedback fetched successfully', {
      feedback: result.data,
      meta: result.meta,
    });
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Feedback not found');
    }
    const feedback = await this.feedbackModel.findById(id);
    if (!feedback) throw new NotFoundException('Feedback not found');
    return successResponse('Feedback fetched successfully', feedback);
  }

  async updateStatus(id: string, dto: UpdateFeedbackStatusDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Feedback not found');
    }
    const feedback = await this.feedbackModel.findByIdAndUpdate(
      id,
      { status: dto.status },
      { new: true },
    );
    if (!feedback) throw new NotFoundException('Feedback not found');
    return successResponse('Feedback updated successfully', feedback);
  }

  async getStats() {
    const [total, neww, reviewed, resolved] = await Promise.all([
      this.feedbackModel.countDocuments(),
      this.feedbackModel.countDocuments({ status: 'new' }),
      this.feedbackModel.countDocuments({ status: 'reviewed' }),
      this.feedbackModel.countDocuments({ status: 'resolved' }),
    ]);
    return successResponse('Feedback stats fetched successfully', {
      total,
      new: neww,
      reviewed,
      resolved,
    });
  }
}
