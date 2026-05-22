import { Controller, Get, Param } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Promotion } from './schemas/promotion.schema';

@Controller('promotion')
@ApiTags('Promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  @ApiOkResponse({ type: [Promotion] })
  async findAll() {
    return this.promotionService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: Promotion })
  async findOne(@Param('id') id: string) {
    return this.promotionService.findOne(id);
  }
}
