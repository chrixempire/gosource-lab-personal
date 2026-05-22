import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ProductService } from './product.service';
import { QueryParamsDto } from '../analytics/dto/query-param.dto';
import { Response } from 'express';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getProducts() {
    return await this.productService.findAll();
  }

  @Get('search')
  async searchProduct(@Query() queryParam: QueryParamsDto) {
    return await this.productService.searchProducts(queryParam);
  }

  @Get('recent-orders/:branchId')
  async getRecentOrders(@Param('branchId') branchId: string) {
    return await this.productService.getRecentOrders(branchId);
  }

  @Get('feed/xml')
  async getProductFeed(
    @Res() res: Response,
    @Query('baseUrl') baseUrl?: string,
    @Query('currency') currency?: string,
    @Query('googleCategory') googleCategory?: string,
  ) {
    const xml = await this.productService.generateProductFeed({
      baseUrl: baseUrl || 'https://dashboard.gosource.app/market',
      currency: currency || 'NGN',
      defaultGoogleCategory: googleCategory || '500',
    });

    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': 'inline; filename="products.xml"',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    });

    return res.send(xml);
  }

  @Get('feed/google')
  async getGoogleShoppingFeed(
    @Res() res: Response,
    @Query('baseUrl') baseUrl?: string,
    @Query('currency') currency?: string,
    @Query('storeName') storeName?: string,
    @Query('storeDescription') storeDescription?: string,
  ) {
    const xml = await this.productService.generateGoogleShoppingFeed({
      baseUrl: baseUrl || 'https://dashboard.gosource.app/market',
      currency: currency || 'NGN',
      storeName: storeName || 'GoSource',
      storeDescription: storeDescription || 'Google Shopping Feed for GoSource',
    });

    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': 'inline; filename="google_shopping_feed.xml"',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    });

    return res.send(xml);
  }

  @Get(':id')
  async getSingleProduct(@Param('id') id: string) {
    return await this.productService.findOne(id);
  }

  // @Patch('update-special')
  // async updatePrices(@Body() data: any) {
  //   return await this.productService.updatePrices(data.customerId);
  // }
}
