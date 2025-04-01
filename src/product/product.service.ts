import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductDto } from 'src/dto/product.dto';
import { Product, ProductDocument } from 'src/schema/product.schema';
import { Role } from 'src/enum/roles.enum';
import { CloudinaryService } from 'src/utils/cloudinary/cloudinary.service';

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);

    constructor(
        @InjectModel(Product.name) private product_model: Model<ProductDocument>,
        private cloudinary_service: CloudinaryService,
    ) {}


    // create product
    async create_product(dto: ProductDto, base64_image: string) {

        let image_url: string;

        // validate image inpute
        if (!base64_image || !base64_image.startsWith('data:image/')) {
            throw new BadRequestException('Invalid product image. Please provide a valid base64-encoded image')
        }

        try {
            const public_id = `user_profiles/${Date.now()}`;
            const upload_result = await this.cloudinary_service.uploadImage(base64_image, public_id);
            image_url = upload_result.secure_url;
          } catch (error) {
            this.logger.error('Error uploading user image:', error);
            throw new BadRequestException('Failed to upload user image');
          }

        try {
            const product = new this.product_model({
                ...dto,
                product_img: image_url,
            });

            const saved_product = await product.save();


            return {
                success: true,
                message: 'Product created successfully!',
                data: saved_product
            }
        } catch (error) {
            this.logger.error(`Error creating product: ${error.message}`);
            throw new BadRequestException('Error creating product, try again');
        }
    }


    // update form
    async update_product(dto: ProductDto, id: string, base64_image?: string) {
        try {
            const existing_product = await this.product_model.findById(id).exec();
    
            if (!existing_product) {
                throw new BadRequestException('Product does not exist.');
            }
    
            let image_url = existing_product.product_img; // Default to existing image
    
            // If a new image is provided, validate and upload it
            if (base64_image && typeof base64_image === 'string') {
                if (!base64_image.startsWith('data:image/')) {
                    throw new BadRequestException('Invalid product image. Please provide a valid base64-encoded image');
                }
    
                try {
                    const public_id = `product_images/${Date.now()}`;
                    const upload_result = await this.cloudinary_service.uploadImage(base64_image, public_id);
                    image_url = upload_result.secure_url;
                } catch (error) {
                    this.logger.error(`Error uploading product image: ${error.message}`, error);
                    throw new BadRequestException('Failed to upload product image. Please try again.');
                }
            }
    
            // Update product fields
            Object.assign(existing_product, dto);
            existing_product.product_img = image_url; // Update image if changed
    
            await existing_product.save();
    
            return {
                success: true,
                message: 'Product was updated successfully!',
                data: existing_product
            };
        } catch (error) {
            this.logger.error(`Error updating product: ${error.message}`, error);
            throw new BadRequestException('An error occurred while updating the product.');
        }
    }
    

    // delete product
    async delete_product(id: string): Promise<any> {
        try {
            const delete_product = await this.product_model.findByIdAndDelete(id).exec();

            if (!delete_product) {
                throw new BadRequestException('Product does not exist!');
                
            }

            return {
                success: true,
                message: 'Product deleted successfully!'
            }
        } catch (error) {
            this.logger.error(`Error deleting product: ${error.message}`);
            throw new BadRequestException('An error occured while deleting form');
        }
    }

    // get product by id
    async get_product_by_id(id: string): Promise<any> {
        try {
            const product = await this.product_model.findById(id).exec();

            if (!product) {
                throw new BadRequestException('Product does not exist');
            }

            return {
                success: true,
                message: 'Product retrieved successfully!',
                data: product
            }
        } catch (error) {
            this.logger.error(`Error retrieving product: ${error.message}`);
            throw new BadRequestException('An error occured while retrieving product');
        }
    }

    // get all products
    async get_all_procduct() {
        try {
            const product = await this.product_model.find().exec();

            return {
                success: true,
                message: 'Products retrieved successfully!',
                data: product
            }
        } catch (error) {
            this.logger.error(`Error retrieving product: ${error.message}`);
            throw new BadRequestException('An error occured while product form');
        }
    }


    // get products by category id
    async get_product_by_category() {
        try {
            const products = await this.product_model.find().exec();
    
            return {
                success: true,
                message: 'Products retrieved successfully!',
                data: products
            };
        } catch (error) {
            this.logger.error(`Error retrieving products: ${error.message}`);
            throw new BadRequestException('An error occurred while retrieving products');
        }
    }


    // ✅ Get Total Product Count
    async get_total_product_count(): Promise<any> {
        try {
            const total_count = await this.product_model.countDocuments();
            return {
                success: true,
                message: "Total product count retrieved successfully",
                data: total_count
            };
        } catch (error) {
            this.logger.error("Error retrieving total product count:", error);
            throw new BadRequestException("Error retrieving total product count: " + error.message);
        }
    }

    
}
