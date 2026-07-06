import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../../product/entities/product.entity';
import {
  Category,
  CategorySchema,
} from '../../category/entities/category.entity';
import { Unit, UnitSchema } from '../../product/entities/units.entity';
import { ActivityModule } from '../../activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Unit.name, schema: UnitSchema },
    ]),
    ActivityModule,
  ],
  providers: [ItemService],
  controllers: [ItemController],
})
export class ItemModule {}
