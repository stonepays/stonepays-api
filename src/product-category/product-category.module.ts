import { Module } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryController } from './product-category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductCategory, ProductCategorySchema } from 'src/schema/product-category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: ProductCategory.name,
      schema: ProductCategorySchema
    }])
  ],
  providers: [ProductCategoryService],
  controllers: [ProductCategoryController],
  exports: [
    MongooseModule.forFeature([{
      name: ProductCategory.name,
      schema: ProductCategorySchema
    }])
  ]
})
export class ProductCategoryModule {}
