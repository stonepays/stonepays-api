import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common'; 
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from 'src/schema/order.schema';
import { OrderDto } from 'src/dto/order.dto';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from 'src/schema/user.schema';
import { Product, ProductDocument } from 'src/schema/product.schema';
import * as moment from 'moment';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        @InjectModel(Order.name) private order_model: Model<OrderDocument>,
        @InjectModel(User.name) private user_model: Model<UserDocument>,
        @InjectModel(Product.name) private product_model: Model<ProductDocument>,
        private config_service: ConfigService
    ) {}

    async create_order(dto: OrderDto): Promise<any> {
        try {
            const tempOrderId = !dto.user_id
                ? dto.temp_order_id && Types.ObjectId.isValid(dto.temp_order_id)
                    ? new Types.ObjectId(dto.temp_order_id)
                    : new Types.ObjectId()
                : undefined;

            // Fetch user details if user_id exists
            let userDetails = null;
            if (dto.user_id) {
                const user = await this.user_model.findById(dto.user_id).exec();
                if (!user) throw new NotFoundException('User not found');
                userDetails = {
                    user_id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    user_img: user.user_img,
                };
            }

            // Fetch product details and check inventory
            const products = [];
            for (const product of dto.products) {
                const productData = await this.product_model.findById(product.product_id).exec();
                if (!productData) throw new NotFoundException(`Product not found: ${product.product_id}`);
                if (productData.product_qty < product.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for product: ${productData.product_name}`
                    );
                }

                // Reduce product quantity
                productData.product_qty -= product.quantity;
                await productData.save();

                products.push({
                    product_id: productData._id,
                    product_category: productData.product_category,
                    quantity: product.quantity,
                    price: product.price,
                });
            }

            // Create and save the order
            const order = new this.order_model({
                user_details: userDetails,
                temp_order_id: tempOrderId,
                products,
                total_price: dto.total_price,
                status: 'Pending',
            });

            const saved_order = await order.save();

            return {
                success: true,
                message: 'Order created successfully',
                data: saved_order,
            };
        } catch (error) {
            if (error.code === 11000) {
                const duplicateField = Object.keys(error.keyValue)[0];
                throw new BadRequestException(
                    `Duplicate key error: ${duplicateField} already exists`
                );
            }
            this.logger.error('Error creating order:', error);
            throw new BadRequestException('Error creating order: ' + error.message);
        }
    }

    
    
    

    // ✅ Get Order by ID
    async get_order_by_id(order_id: string): Promise<any> {
        try {
            const order = await this.order_model.findById(order_id).exec();
            if (!order) {
                throw new NotFoundException("Order not found");
            }
            return {
                success: true,
                message: "Order retrieved successfully",
                data: order
            };
        } catch (error) {
            this.logger.error("Error retrieving order:", error);
            throw new BadRequestException("Error retrieving order: " + error.message);
        }
    }

    // ✅ Get All Orders
    async get_orders(): Promise<any> {
        try {
            const orders = await this.order_model.find().exec();
            return {
                success: true,
                message: "Orders retrieved successfully",
                data: orders
            };
        } catch (error) {
            this.logger.error("Error retrieving orders:", error);
            throw new BadRequestException("Error retrieving orders: " + error.message);
        }
    }

    // ✅ Update Order
    async update_order(order_id: string, dto: OrderDto): Promise<any> {
        try {
            const order = await this.order_model.findById(order_id).exec();
            if (!order) {
                throw new NotFoundException("Order not found");
            }

            Object.assign(order, dto);
            await order.save();

            return {
                success: true,
                message: "Order updated successfully",
                data: order
            };
        } catch (error) {
            this.logger.error("Error updating order:", error);
            throw new BadRequestException("Error updating order: " + error.message);
        }
    }

    // ✅ Delete Order
    async delete_order(order_id: string): Promise<any> {
        try {
            const deleted_order = await this.order_model.findByIdAndDelete(order_id).exec();
            if (!deleted_order) {
                throw new NotFoundException("Order not found");
            }
            return {
                success: true,
                message: "Order deleted successfully"
            };
        } catch (error) {
            this.logger.error("Error deleting order:", error);
            throw new BadRequestException("Error deleting order: " + error.message);
        }
    }

    // ✅ Attach Order to User After Sign-up
    async attach_order_to_user(user_id: string, temp_order_id: string): Promise<any> {
        try {
            const order = await this.order_model.findOne({ temp_order_id }).exec();
            if (!order) {
                return { success: false, message: "No pending orders found" };
            }

            order.user_details.user_id = new Types.ObjectId(user_id);
            order.temp_order_id = null;
            await order.save();

            return { success: true, message: "Order attached to user successfully" };
        } catch (error) {
            this.logger.error("Error attaching order:", error);
            throw new BadRequestException("Error attaching order: " + error.message);
        }
    }


    // ✅ Get Total Order Count
    async get_total_order_count(): Promise<any> {
        try {
            const total_count = await this.order_model.countDocuments();
            return {
                success: true,
                message: "Total order count retrieved successfully",
                data: total_count
            };
        } catch (error) {
            this.logger.error("Error retrieving total order count:", error);
            throw new BadRequestException("Error retrieving total order count: " + error.message);
        }
    }


    async get_orders_by_period(period: 'weekly' | 'monthly' | 'yearly'): Promise<any> {
        try {
            let startDate: Date;
    
            switch (period) {
                case 'weekly':
                    startDate = moment().startOf('isoWeek').toDate();
                    break;
                case 'monthly':
                    startDate = moment().startOf('month').toDate();
                    break;
                case 'yearly':
                    startDate = moment().startOf('year').toDate();
                    break;
                default:
                    throw new BadRequestException("Invalid period. Use 'weekly', 'monthly', or 'yearly'.");
            }
    
            // Fetch only total_price and createdAt fields
            const orders = await this.order_model
                .find({ createdAt: { $gte: startDate } })
                .select('total_price createdAt')
                .exec();
    
            return {
                success: true,
                message: `Orders retrieved for ${period}`,
                data: orders
            };
        } catch (error) {
            this.logger.error(`Error retrieving ${period} orders:`, error);
            throw new BadRequestException(`Error retrieving ${period} orders: ${error.message}`);
        }
    }
    
    
     // Get the top 10 sold products with total amount
     async get_top_sold_products(): Promise<any> {
        try {
            // Aggregate order data to get the count of each product sold and the total revenue
            const result = await this.order_model.aggregate([
                { $unwind: '$products' }, // Flatten the products array in each order
                {
                    $group: {
                        _id: '$products.product_id', // Group by product_id
                        total_sold: { $sum: '$products.quantity' }, // Sum the quantity sold for each product
                        total_revenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }, // Calculate total revenue
                    },
                },
                { $sort: { total_sold: -1 } }, // Sort by total_sold in descending order
                { $limit: 10 }, // Limit the results to top 10
            ]);

            // Map the result to include product details
            const topProducts = await Promise.all(
                result.map(async (item) => {
                    const product = await this.product_model.findById(item._id).exec();
                    return {
                        product_id: product._id,
                        product_name: product.product_name,
                        total_sold: item.total_sold,
                        total_revenue: item.total_revenue.toFixed(2), // Formatting the total revenue to two decimal places
                        product_img: product.product_img,
                    };
                }),
            );

            return {
                success: true,
                message: 'Top 10 sold products retrieved successfully',
                data: topProducts,
            };
        } catch (error) {
            this.logger.error('Error retrieving top sold products:', error);
            throw new BadRequestException('Error retrieving top sold products: ' + error.message);
        }
    }
}
