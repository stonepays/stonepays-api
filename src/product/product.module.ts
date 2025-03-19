import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'src/schema/product.schema';
import { CloudinaryService } from 'src/utils/cloudinary/cloudinary.service';
import { CloudinaryController } from 'src/utils/cloudinary/cloudinary.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: Product.name,
      schema: ProductSchema
    }])
  ],
  providers: [
    ProductService,
    CloudinaryService,
  ],
  controllers: [
    ProductController,
    CloudinaryController
  ],
  exports: [
    MongooseModule.forFeature([{
      name: Product.name,
      schema: ProductSchema
    }])
  ]
})
export class ProductModule {}
