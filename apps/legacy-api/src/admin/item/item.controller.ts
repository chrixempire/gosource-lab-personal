import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { AdminRoles } from '../auth/enum/admin.enum';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { Roles } from '../auth/decorator/role.decorator';
import { multerOptions } from '../../cloudinary/utils/multer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateItemDto } from './dto/item.dto';
import { RequiredPermission } from '../role/enum/required-permission';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';
import { UseGuards } from '@nestjs/common';

@Controller('admin/item')
export class ItemController {
  constructor(private itemService: ItemService) {}

  @Post()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.CREATE_UPDATE_PRODUCT)
  @AdminAuth()
  @UseGuards(AdminRolesGuard)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: multerOptions.limits,
      fileFilter: multerOptions.imageFilter,
    }),
  )
  async addProduct(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() productData: CreateItemDto,
  ) {
    return await this.itemService.addProduct(productData, files);
  }
}
