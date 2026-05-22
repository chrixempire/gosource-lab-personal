import {
  Controller,
  Get,
  Param,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../cloudinary/utils/multer';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async findAll() {
    return await this.categoryService.findAll();
  }

  @Get('plain')
  async getOnlyCategory() {
    return await this.categoryService.getOnlyCategories();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Get('plain/:id')
  async getOnlySingleCategory(@Param('id') id: string) {
    return this.categoryService.getOnlyCategory(id);
  }

  @Patch('update-image/:id')
  @UseInterceptors(
    FileInterceptor('images', {
      limits: multerOptions.limits,
      fileFilter: multerOptions.imageFilter,
    }),
  )
  async updateUserProfile(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') categoryId: string,
  ) {
    return await this.categoryService.updateCategoryImage(categoryId, file);
  }
}
