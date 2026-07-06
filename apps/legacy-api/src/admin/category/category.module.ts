import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import {
  Category,
  CategorySchema,
} from '../../category/entities/category.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../../product/entities/product.entity';
import {
  ActivityLog,
  ActivityLogSchema,
} from '../../activity/schema/activityLog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
  ],
  providers: [CategoryService],
  controllers: [CategoryController],
})
export class AdminCategoryModule {}
