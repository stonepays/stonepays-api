import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductCategoryDto } from 'src/dto/product-category.dto';
import { ProductCategory, ProductCategoryDocument } from 'src/schema/product-category.schema';

@Injectable()
export class ProductCategoryService {
    private readonly logger = new Logger(ProductCategoryService.name);

    constructor(
        @InjectModel(ProductCategory.name) private product_category_model: Model<ProductCategoryDocument>,
    ) {}


    // create product category
    async create_product_category(dto: ProductCategoryDto) {
        try {
            const category = new this.product_category_model({
                ...dto
            });

            const saved_category = await category.save();

            return {
                success: true,
                message: 'Product category created successfully!',
                data: saved_category
            }
        } catch (error) {
            this.logger.error(`Error creating product category: ${error.message}`);
            throw new BadRequestException('Error creating product category, try again');
        }
    }

    // update product category
    async update_product_category(id: string, dto: ProductCategoryDto) {
        try {
            const existing_category = await this.product_category_model.findById(id).exec();

            if (!existing_category) {
                throw new BadRequestException('Product category does not exist');
            }

            Object.assign(existing_category, dto);
            await existing_category.save();

            return {
                success: true,
                message: 'Product category updated successfully!',
                data: existing_category
            };
        } catch (error) {
            this.logger.error(`Error updating product category: ${error.message}`);
            throw new BadRequestException('Error updating product category, try again');
        }
    }


    // get product category by id
    async get_product_category(id: string): Promise<any> {
        try {
            const category = await this.product_category_model.findById(id).exec();

            if (!category) {
                throw new BadRequestException("Product category does not exist");
            }

            return {
                success: true,
                message: "Product category retrieved successfully!",
                data: category
            }
        } catch (error) {
            this.logger.error(`Error retrieving product category: ${error.message}`);
            throw new BadRequestException('Error retrieving product category, try again');
        }
    }


    // get product category by id
    async delete_product_category(id: string): Promise<any> {
        try {
            const category = await this.product_category_model.findByIdAndDelete(id).exec();

            if (!category) {
                throw new BadRequestException("Product category does not exist");
            }

            return {
                success: true,
                message: "Product category deleted successfully!",
            }
        } catch (error) {
            this.logger.error(`Error deleting product category: ${error.message}`);
            throw new BadRequestException('Error deleting product category, try again');
        }
    }


    async get_product_categories() {
        try {
            const category = await this.product_category_model.find().exec();

            return {
                success: true,
                message: "Product categories retrieved successfully",
                data: category
            }
        } catch (error) {
            this.logger.error(`Error retrieving product categories: ${error.message}`);
            throw new BadRequestException('Error retrieving product categories, try again');
        }
    }



}
