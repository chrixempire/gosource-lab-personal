import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import {
  Category,
  CategorySchema,
} from '../../category/entities/category.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../../product/entities/product.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  providers: [CategoryService],
  controllers: [CategoryController],
})
export class AdminCategoryModule {}
