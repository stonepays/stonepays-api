import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from 'src/schema/cart.schema';
import { Model, Types } from 'mongoose';
import { CartDto } from 'src/dto/cart.dto';

@Injectable()
export class CartService {
    constructor(
        @InjectModel(Cart.name) private cart_model: Model<CartDocument>,
    ) {}


    async add_to_cart(dto: CartDto) {
        const { user_id, temp_order_id, products } = dto;
    
        const filter = user_id
            ? { 'user_details.user_id': new Types.ObjectId(user_id) }
            : { temp_order_id: new Types.ObjectId(temp_order_id) };
    
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
            user_details: user_id
                ? { user_id: new Types.ObjectId(user_id) }
                : null,
            temp_order_id: temp_order_id ? new Types.ObjectId(temp_order_id) : null,
            products,
            total_price,
        });
    
        return {
            success: true,
            message: 'Cart added successfully!',
            data: await cart.save(),
        };
    }
    

    async update_cart(dto: CartDto) {
        const { user_id, temp_order_id, products } = dto;
    
        const filter = user_id
            ? { 'user_details.user_id': new Types.ObjectId(user_id) }
            : { temp_order_id: new Types.ObjectId(temp_order_id) };
    
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
    
        await cart.save();
    
        return {
            success: true,
            message: 'Cart updated successfully!',
            data: cart,
        };
    }
    


    async get_cart(userId: string | null, temp_cart_id: string | null  ) {
        const filter = userId
            ? { 'user_details.user_id': new Types.ObjectId(userId)}
            : { temp_cart_id: new Types.ObjectId(temp_cart_id)};

            const cart = await this.cart_model.findOne(filter);
            
            if (!cart) {
                throw new NotFoundException('Cart not found')
            }

            return {
                success: true,
                message: 'Cart retrieved successfully!',
                data: cart
            }
    }


    async remove_from_cart(user_id: string, product_id: string) {
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
    }


    async clear_cart(user_id: string) {
        const cart = await this.cart_model.findOneAndDelete({
            'user_details.user_id': new Types.ObjectId(user_id),
        });

        return {
            success: true,
            message: 'Cart cleared successfully!'
        }
    }
}
