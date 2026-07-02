import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '../admin/auth/decorator/admin-auth.decorator';
import { ReviewService } from './review.service';

@Controller('admin/reviews')
@AdminAuth()
@ApiTags('Admin / Reviews')
export class AdminReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  async findAll(
    @Query()
    query: {
      page?: number;
      limit?: number;
      search?: string;
      rating?: number;
    },
  ) {
    return await this.reviewService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return await this.reviewService.getStats();
  }
}
