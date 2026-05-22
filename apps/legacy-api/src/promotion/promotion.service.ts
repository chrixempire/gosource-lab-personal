import { Injectable, NotFoundException } from '@nestjs/common';
import { Promotion } from './schemas/promotion.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { successResponse } from '../utils/responses';

@Injectable()
export class PromotionService {
  constructor(
    @InjectModel(Promotion.name) private promotionModel: Model<Promotion>,
  ) {}

  async findAll() {
    const promotions = await this.promotionModel
      .find({
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      })
      .populate('products')
      .exec();

    return successResponse('Get promotions successfully', promotions);
  }

  async findOne(id: string) {
    const promotion = await this.promotionModel
      .findById(id)
      .populate('products')
      .exec();

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return successResponse('Get promotion successfully', promotion);
  }
}
