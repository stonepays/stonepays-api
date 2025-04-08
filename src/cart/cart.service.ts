import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from 'src/schema/cart.schema';
import { Model, Types } from 'mongoose';
import { CartDto } from 'src/dto/cart.dto';
import { User, UserDocument } from 'src/schema/user.schema';

@Injectable()
export class CartService {
    constructor(
        @InjectModel(Cart.name) private cart_model: Model<CartDocument>,
    ) {}


    async add_to_cart(dto: CartDto) {
       try {
            const { user_id, products } = dto;

            if (!user_id || !Types.ObjectId.isValid(user_id)) {
                throw new NotFoundException('Valid user ID is required');
            }

            const filter = { 'user_details.user_id': new Types.ObjectId(user_id) };

            const existingCart = await this.cart_model.findOne(filter);
            if (existingCart) {
                return {
                    success: false,
                    message: 'Cart already exists. Use update_cart instead.',
                };
            }

            const total_price = products.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
            );

            const cart = new this.cart_model({
                user_details: {
                    user_id: new Types.ObjectId(user_id),
                },
                products,
                total_price,
            });

            const savedCart = await cart.save();

            return {
                success: true,
                message: 'Cart added successfully!',
                data: savedCart,
            };
       } catch (error) {
            throw new BadRequestException('Error adding to cart: ' + error.message);
       }
    }

    async update_cart(dto: CartDto) {
        try {
            const { user_id, products } = dto;

            if (!user_id || !Types.ObjectId.isValid(user_id)) {
                throw new NotFoundException('Valid user ID is required');
            }

            const filter = { 'user_details.user_id': new Types.ObjectId(user_id) };

            const cart = await this.cart_model.findOne(filter);

            if (!cart) {
                return {
                    success: false,
                    message: 'Cart does not exist. Use add_to_cart first.',
                };
            }

            for (const new_product of products) {
                const index = cart.products.findIndex(
                    (p) => p.product_id.toString() === new_product.product_id,
                );

                if (index !== -1) {
                    cart.products[index].quantity += new_product.quantity;
                } else {
                    cart.products.push(new_product as any);
                }
            }

            cart.total_price = cart.products.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
            );

            const updatedCart = await cart.save();

            return {
                success: true,
                message: 'Cart updated successfully!',
                data: updatedCart,
            };
        } catch (error) {
            throw new BadRequestException('Error updating cart: ' + error.message);
        }
    }

    async get_cart(userId: string | null) {
        try {
            if (!userId || !Types.ObjectId.isValid(userId)) {
                throw new NotFoundException('Invalid or missing user ID');
            }
        
            const filter = { 'user_details.user_id': new Types.ObjectId(userId) };
        
            const cart = await this.cart_model.findOne(filter);
        
            if (!cart) {
                throw new NotFoundException('Cart not found');
            }
        
            return {
                success: true,
                message: 'Cart retrieved successfully!',
                data: cart,
            };
        } catch (error) {
            throw new BadRequestException('Error retrieving from cart: ' + error.message);
        }
    }
    


    async remove_from_cart(user_id: string, product_id: string) {
        try {
            const cart = await this.cart_model.findOne({
                'user_details.user_id': new Types.ObjectId(user_id),
            });
    
    
            if (!cart) {
                throw new NotFoundException('Cart not found');
            }
    
            cart.products = cart.products.filter(
                (p) => p.product_id.toString() !== product_id,
            );
    
            cart.total_price = cart.products.reduce(
                (sum, item) => sum + item.price * item.quantity, 0,
            );
    
    
            return {
                success: true,
                message: 'Product removed from cart successfully!',
                data: await cart.save()
            }
        } catch (error) {
            throw new BadRequestException('Error removing from cart: ' + error.message);
        }
    }


    async clear_cart(user_id: string) {
        try {
            const cart = await this.cart_model.findOneAndDelete({
                'user_details.user_id': new Types.ObjectId(user_id),
            });
    
            return {
                success: true,
                message: 'Cart cleared successfully!'
            }
        } catch (error) {
            throw new BadRequestException('Error clearing cart: ' + error.message);
        }
    }
}
