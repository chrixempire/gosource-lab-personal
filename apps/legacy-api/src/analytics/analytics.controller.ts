import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { QueryParamsDto } from './dto/query-param.dto';
import { Business } from '../business/decorator/business.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('order/branch/:branchId')
  @UseGuards(AuthGuard)
  async getOrdersByBranch(
    @Query() queryParams: QueryParamsDto,
    @Param('branchId') branchId: string,
  ) {
    return await this.analyticsService.getOrdersByBranch(branchId, queryParams);
  }

  @Get('order/frequency')
  @UseGuards(AuthGuard)
  async getOrderFrequent(
    @Query() queryParams: QueryParamsDto,
    @Business() business: any,
  ) {
    return await this.analyticsService.getOrderFrequency(business.id);
  }

  @Get('procured-items/branch/:branchId')
  @UseGuards(AuthGuard)
  async getProcuredByBranch(
    @Query() queryParams: QueryParamsDto,
    @Param('branchId') branchId: string,
  ) {
    return await this.analyticsService.getProcuredItemsByBranch(
      branchId,
      queryParams,
    );
  }

  @Get('total-procurement/branch/:branchId')
  @UseGuards(AuthGuard)
  async getTotalProcurementByBranch(
    @Query() queryParams: QueryParamsDto,
    @Param('branchId') branchId: string,
  ) {
    return await this.analyticsService.getTotalProcurement(
      branchId,
      queryParams,
    );
  }

  @Get('top-procured-items/branch/:branchId')
  @UseGuards(AuthGuard)
  async getTopProcuredItemsByBranch(
    @Query() queryParams: QueryParamsDto,
    @Param('branchId') branchId: string,
  ) {
    return await this.analyticsService.getTopProcuredItems(
      branchId,
      queryParams,
    );
  }

  @Get('product-analysis/branch/:branchId')
  @UseGuards(AuthGuard)
  async getProductAnalysis(
    @Query() queryParams: QueryParamsDto,
    @Param('branchId') branchId: string,
  ) {
    return await this.analyticsService.getProductAnalysis(
      branchId,
      queryParams,
    );
  }

  @Get('price-trend/branch/:branchId')
  @UseGuards(AuthGuard)
  async getPriceTrend(
    @Query() queryParams: QueryParamsDto,
    @Param('branchId') branchId: string,
  ) {
    return await this.analyticsService.getPriceTrend(branchId, queryParams);
  }

  @Get('order-history-trends')
  @UseGuards(AuthGuard)
  async getOrderHistoryTrends(@Business() business: any) {
    return this.analyticsService.getOrderHistoryTrends(business.id);
  }

  @Get('order-frequency')
  @UseGuards(AuthGuard)
  async getOrderFrequency(@Business() business: any) {
    return this.analyticsService.getOrderFrequency(business.id);
  }

  @Get('top-purchased-products')
  @UseGuards(AuthGuard)
  async getTopPurchasedProducts(@Business() business: any) {
    return this.analyticsService.getTopPurchasedProducts(business.id);
  }

  @Get('branch-performance')
  @UseGuards(AuthGuard)
  async getBranchPerformance(@Business() business: any) {
    return this.analyticsService.getBranchPerformance(business.id);
  }

  @Get('anal-data')
  @UseGuards(AuthGuard)
  async getAnalData(@Business() business: any) {
    return this.analyticsService.getAnalyticsData(business);
  }

  @Get('/get-total-per-day')
  @UseGuards(AuthGuard)
  async getTotalPerDayForWeek(@Business() business: any) {
    return await this.analyticsService.getTotalPerDayForWeek(business);
  }

  @Get('general-stats')
  @UseGuards(AuthGuard)
  async getGeneralStats(@Business() business: any) {
    return await this.analyticsService.getGeneralStats(business);
  }
}
