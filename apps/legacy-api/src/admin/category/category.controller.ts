import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminRoles } from '../auth/enum/admin.enum';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { Roles } from '../auth/decorator/role.decorator';
import { CreateCategoryDto } from '../../category/dto/create-category.dto';
import { CategoryService } from './category.service';
import { UpdateCategoryDto } from '../../category/dto/update-category.dto';
import { multerOptions } from '../../cloudinary/utils/multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';
import { DeleteCategoryDto } from './dto/delete-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { RequiredPermission } from '../role/enum/required-permission';
import { Admin } from '../auth/decorator/admin.decorator';
import { SkipActivityLog } from '../../activity/skip-activity-log.decorator';

@Controller('admin/category')
@AdminAuth()
@SkipActivityLog() // writes its own rich activity logs
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_CATEGORY)
  @UseGuards(AdminRolesGuard)
  @UseInterceptors(
    FileInterceptor('images', {
      limits: multerOptions.limits,
      fileFilter: multerOptions.imageFilter,
    }),
  )
  async createCategory(
    @Admin() admin: any,
    @Body() categoryDetails: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.categoryService.createCategory(
      categoryDetails,
      file,
      admin,
    );
  }

  @Get()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CATEGORY)
  @UseGuards(AdminRolesGuard)
  async getCategories(@Query() queryParams: FilterCategoryDto) {
    return await this.categoryService.getCategories(queryParams);
  }

  @Patch('rearrange')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.REARRANGE_CATEGORY)
  @UseGuards(AdminRolesGuard)
  async rearrangeCategory(@Admin() admin: any, @Body() dto: ReorderCategoriesDto) {
    return await this.categoryService.rearrangeCategory(dto, admin);
  }

  @Patch('assign-positions')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.REARRANGE_CATEGORY)
  @UseGuards(AdminRolesGuard)
  async assignPositions() {
    return await this.categoryService.assignPositions();
  }

  @Get(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CATEGORY)
  @UseGuards(AdminRolesGuard)
  async getSingleCategory(@Param('id') categoryId: string) {
    return await this.categoryService.getSingleCategory(categoryId);
  }

  @Patch(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_CATEGORY)
  @UseGuards(AdminRolesGuard)
  @UseInterceptors(
    FileInterceptor('images', {
      limits: multerOptions.limits,
      fileFilter: multerOptions.imageFilter,
    }),
  )
  async updateCategory(
    @Admin() admin: any,
    @Param('id') categoryId: string,
    @Body() categoryData: UpdateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.categoryService.updateCategory(
      categoryId,
      categoryData,
      file,
      admin,
    );
  }

  @Delete(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.DELETE_CATEGORY)
  @UseGuards(AdminRolesGuard)
  async deleteCategory(
    @Admin() admin: any,
    @Param('id') id: string,
    @Body() deleteCategoryDto: DeleteCategoryDto,
  ) {
    return this.categoryService.remove(id, deleteCategoryDto, admin);
  }
}
