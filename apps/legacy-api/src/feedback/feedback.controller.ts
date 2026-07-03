import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { Business } from '../business/decorator/business.decorator';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
@ApiTags('Feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(AuthGuard)
  async submit(@Body() dto: CreateFeedbackDto, @Business() business: any) {
    return await this.feedbackService.create(dto, business);
  }
}
