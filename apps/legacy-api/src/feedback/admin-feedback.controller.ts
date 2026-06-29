import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '../admin/auth/decorator/admin-auth.decorator';
import { UpdateFeedbackStatusDto } from './dto/feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('admin/feedback')
@AdminAuth()
@ApiTags('Admin / Feedback')
export class AdminFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  async findAll(
    @Query()
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      category?: string;
    },
  ) {
    return await this.feedbackService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return await this.feedbackService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.feedbackService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackStatusDto,
  ) {
    return await this.feedbackService.updateStatus(id, dto);
  }
}
