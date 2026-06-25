import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { multerOptions } from '../../cloudinary/utils/multer';
import { ProductService } from './product.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AdminRoles } from '../auth/enum/admin.enum';
import { Roles } from '../auth/decorator/role.decorator';
import {
  CreateBatchProductDto,
  CreateProductDto,
  CreateUnitDto,
  DateFilterDto,
  DeductBatchProductDto,
} from './dto/create-product.dto';
import { OrderFilterParams } from '../../utils/filter';
import {
  CreateStockCountDto,
  QueryFilterDto,
} from './dto/create-stock-count.dto';
import { Admin } from '../auth/decorator/admin.decorator';
import { RequiredPermission } from '../role/enum/required-permission';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';

@Controller('admin/product')
@AdminAuth()
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_PRODUCT)
  @UseGuards(AdminRolesGuard)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: multerOptions.limits,
      fileFilter: multerOptions.imageFilter,
    }),
  )
  async addProduct(
    @Admin() admin: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() productData: CreateProductDto,
  ) {
    return await this.productService.addProduct(productData, files, admin);
  }

  @Post('units')
  async createUnit(@Body() unitData: CreateUnitDto) {
    return await this.productService.createUnit(unitData);
  }

  @Get('units')
  async getUnits() {
    return await this.productService.getUnits();
  }

  @Get('best-selling-items')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_INVENTORY_REPORTS)
  @UseGuards(AdminRolesGuard)
  async getBestSellingItems(@Query() query: DateFilterDto) {
    return await this.productService.getBestSellingItems(query);
  }

  @Get('inventory-movement')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_INVENTORY_REPORTS)
  @UseGuards(AdminRolesGuard)
  async getInventoryMovement(@Query() query: DateFilterDto) {
    return await this.productService.getInventoryMovements(query);
  }

  @Post('stock-counts')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_STOCK)
  @UseGuards(AdminRolesGuard)
  async addStockCount(@Admin() admin: any, @Body() body: CreateStockCountDto) {
    return await this.productService.addStockCount(admin.id, body);
  }

  @Get('stock-counts')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_STOCK_COUNTS)
  @UseGuards(AdminRolesGuard)
  async getStockCounts(@Query() query: QueryFilterDto) {
    return await this.productService.getStockCounts(query);
  }

  @Get('stock-counts/:id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_STOCK_COUNTS)
  @UseGuards(AdminRolesGuard)
  async getSingleStockCount(@Param('id') id: string) {
    return await this.productService.getSingleStockCount(id);
  }

  @Patch(':productId/deactivate')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.ACTIVATE_DEACTIVATE_PRODUCT)
  @UseGuards(AdminRolesGuard)
  async deactivateProduct(
    @Admin() admin: any,
    @Param('productId') productId: string,
  ) {
    return await this.productService.deactivateItem(productId, admin);
  }

  @Patch(':productId/activate')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.ACTIVATE_DEACTIVATE_PRODUCT)
  @UseGuards(AdminRolesGuard)
  async activateProduct(
    @Admin() admin: any,
    @Param('productId') productId: string,
  ) {
    return await this.productService.activateItem(productId, admin);
  }

  @Patch(':productId/add-stock')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_STOCK)
  @UseGuards(AdminRolesGuard)
  async addBatchProduct(
    @Admin() admin: any,
    @Body() productData: CreateBatchProductDto,
    @Param('productId') productId: string,
  ) {
    return await this.productService.addBatchProduct(
      productData,
      productId,
      admin,
    );
  }

  @Patch(':productId/deduct-stock')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_STOCK)
  @UseGuards(AdminRolesGuard)
  async deductBatchProduct(
    @Admin() admin: any,
    @Body() productData: DeductBatchProductDto,
    @Param('productId') productId: string,
  ) {
    return await this.productService.deductBatchProduct(
      productData,
      productId,
      admin,
    );
  }

  @Patch(':productId/in-stock')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_STOCK)
  @UseGuards(AdminRolesGuard)
  async setProductInStock(
    @Admin() admin: any,
    @Param('productId') productId: string,
  ) {
    return await this.productService.setProductInStock(productId, admin);
  }

  @Patch(':productId/out-stock')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_STOCK)
  @UseGuards(AdminRolesGuard)
  async setProductOutOfStock(
    @Admin() admin: any,
    @Param('productId') productId: string,
  ) {
    return await this.productService.setProductOutOfStock(productId, admin);
  }

  @Patch(':productId')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_PRODUCT)
  @UseGuards(AdminRolesGuard)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: multerOptions.limits,
      fileFilter: multerOptions.imageFilter,
    }),
  )
  async updateProduct(
    @Admin() admin: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() productData: CreateProductDto,
    @Param('productId') productId: string,
  ) {
    return await this.productService.updateProduct(
      productData,
      productId,
      files,
      admin,
    );
  }

  @Get()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_PRODUCT)
  @UseGuards(AdminRolesGuard)
  async getAllProducts() {
    return await this.productService.getProducts();
  }

  @Get('filtered')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_PRODUCT)
  @UseGuards(AdminRolesGuard)
  async getFilteredProducts(@Query() queryParams: OrderFilterParams) {
    return await this.productService.getFilteredProducts(queryParams);
  }

  @Get('/:productId')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_PRODUCT)
  @UseGuards(AdminRolesGuard)
  async getSingleProduct(@Param('productId') productId: string) {
    return await this.productService.getSingleProduct(productId);
  }
}
