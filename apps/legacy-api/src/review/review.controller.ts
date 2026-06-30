import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { Business } from '../business/decorator/business.decorator';
import { CreateReviewDto } from './dto/review.dto';
import { ReviewService } from './review.service';

@Controller('reviews')
@ApiTags('Reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(AuthGuard)
  async submit(@Body() dto: CreateReviewDto, @Business() business: any) {
    return await this.reviewService.create(dto, business);
  }

  @Get('order/:orderId')
  @UseGuards(AuthGuard)
  async hasReviewed(
    @Param('orderId') orderId: string,
    @Business() business: any,
  ) {
    return await this.reviewService.hasReviewed(orderId, business);
  }
}
