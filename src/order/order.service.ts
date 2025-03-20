import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common'; 
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from 'src/schema/order.schema';
import { OrderDto } from 'src/dto/order.dto';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from 'src/schema/user.schema';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        @InjectModel(Order.name) private order_model: Model<OrderDocument>,
        @InjectModel(User.name) private user_model: Model<UserDocument>,
        private config_service: ConfigService
    ) {}

    // ✅ Create Order (Unauthenticated users allowed)
    async create_order(dto: OrderDto): Promise<any> {
        try {
            const tempOrderId = !dto.user_id 
                ? dto.temp_order_id && Types.ObjectId.isValid(dto.temp_order_id) 
                    ? new Types.ObjectId(dto.temp_order_id) 
                    : new Types.ObjectId()
                : undefined; // ✅ Use undefined instead of null
    
            const order = new this.order_model({
                user_id: dto.user_id ? new Types.ObjectId(dto.user_id) : null,
                temp_order_id: tempOrderId, // ✅ Prevents duplicate null values
                products: dto.products.map(product => ({
                    product_id: new Types.ObjectId(product.product_id),
                    quantity: product.quantity,
                    price: product.price
                })),
                total_price: dto.total_price,
                status: "Pending"
            });
    
            const saved_order = await order.save();
    
            return {
                success: true,
                message: "Order created successfully",
                data: saved_order
            };
        } catch (error) {
            this.logger.error("Error creating order:", error);
            throw new BadRequestException("Error creating order: " + error.message);
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

            order.user_id = new Types.ObjectId(user_id);
            order.temp_order_id = null;
            await order.save();

            return { success: true, message: "Order attached to user successfully" };
        } catch (error) {
            this.logger.error("Error attaching order:", error);
            throw new BadRequestException("Error attaching order: " + error.message);
        }
    }

   // ✅ Checkout Order (Authenticated Users Only)
    // async check_out_order(order_id: string, checkoutDto: CheckoutOrderDto): Promise<any> {
    //     const { user_id } = checkoutDto;

    //     const order = await this.order_model.findOne({ _id: order_id, user_id }).exec();
    //     if (!order) {
    //         throw new NotFoundException("Order not found");
    //     }

    //     if (!order.user_id) {
    //         throw new BadRequestException("User is not authenticated. Please sign up or log in.");
    //     }

    //     const api_key = this.config_service.get("PALMPAY_API_KEY"); // ✅ Use correct Public Key
    //     const merchant_id = this.config_service.get("PALMPAY_MERCHANT_ID");
    //     const redirect_url = this.config_service.get("PALMPAY_REDIRECT_URL");
    //     const payment_api = this.config_service.get("PALMPAY_PAYMENTS_INITIATE_API");

    //     // ✅ Fix User Query
    //     const user = await this.user_model.findById(user_id);
    //     if (!user) {
    //         throw new BadRequestException("User not found.");
    //     }

    //     const payment_data = {
    //         merchantId: merchant_id,
    //         orderId: order_id.toString(),
    //         currency: "NGN",
    //         redirectUrl: redirect_url,
    //         description: `Payment for Order ${order_id}`,
    //         customerEmail: user.email,
    //     };

    //     try {
    //         const response = await axios.post(payment_api, payment_data, {
    //             headers: { Authorization: `Bearer ${api_key}` },
    //         });

    //         if (response.data.status !== "success") {
    //             throw new BadRequestException("PalmPay transaction initialization failed");
    //         }

    //         return {
    //             success: true,
    //             message: "Redirect to PalmPay for payment",
    //             paymentUrl: response.data.paymentUrl,
    //         };
    //     } catch (error) {
    //         this.logger.error("PalmPay checkout error:", error);
    //         throw new BadRequestException(`PalmPay checkout error: ${error.message}`);
    //     }
    // }



    // ✅ Checkout Order (Using Paystack)

    // async check_out_order(order_id: string, checkoutDto: CheckoutOrderDto): Promise<any> {
    //     const { user_id } = checkoutDto;

    //     // 🔹 Validate Order
    //     const order = await this.order_model.findOne({ _id: order_id, user_id }).exec();
    //     if (!order) {
    //         throw new NotFoundException("Order not found");
    //     }
    //     if (!order.user_id) {
    //         throw new BadRequestException("User is not authenticated. Please sign up or log in.");
    //     }

    //     // 🔹 Get Paystack API Key
    //     const paystack_secret_key = this.config_service.get("PAYSTACK_SECRET_KEY");
    //     // const paystack_api_url = this.config_service.get("PAYSTACK_INITIATE_PAYMENT_API");

    //     // 🔹 Retrieve User Email
    //     const user = await this.user_model.findById(user_id);
    //     if (!user) {
    //         throw new BadRequestException("User not found.");
    //     }

    //     // 🔹 Prepare Payment Data for Paystack
    //     const payment_data = {
    //         email: user.email,  // Paystack requires customer email
    //         amount: order.total_price * 100, // Paystack expects amount in kobo (NGN 1000 → 100000 kobo)
    //         currency: "NGN",
    //         reference: `ORDER_${order_id}`, // Unique reference for the transaction
    //         callback_url: this.config_service.get("PAYSTACK_REDIRECT_URL"), // Redirect URL after payment
    //     };

    //     try {
    //         // 🔹 Make API Request to Paystack
    //         const response = await axios.post("https://api.paystack.co/transaction/initialize", payment_data, {
    //             headers: { Authorization: `Bearer ${paystack_secret_key}` },
    //         });

    //         // 🔹 Validate Response
    //         if (!response.data.status) {
    //             throw new BadRequestException("Paystack transaction initialization failed");
    //         }

    //         return {
    //             success: true,
    //             message: "Redirect to Paystack for payment",
    //             paymentUrl: response.data.data.authorization_url, // Paystack's redirect URL
    //         };
    //     } catch (error) {
    //         this.logger.error("Paystack checkout error:", error);
    //         throw new BadRequestException(`Paystack checkout error: ${error.message}`);
    //     }
    // }

    // ✅ Verify PalmPay Payment
    // async verify_payment(order_id: string, transaction_id: string): Promise<any> {
    //     const api_key = this.config_service.get("PALMPAY_API_KEY");
    //     const palmpay_api = this.config_service.get("PALMPAY_PAYMENT_API");

    //     try {
    //         const response = await axios.get(`${palmpay_api}/${transaction_id}/status`, {
    //             headers: {
    //                 Authorization: `Bearer ${api_key}`,
    //             },
    //         });

    //         if (response.data.status !== "success") {
    //             throw new BadRequestException("Payment verification failed");
    //         }

    //         const order = await this.order_model.findById(order_id);
    //         if (!order) {
    //             throw new NotFoundException("Order not found");
    //         }

    //         order.status = "Paid";
    //         await order.save();

    //         return {
    //             success: true,
    //             message: "Payment verified successfully!",
    //             data: order,
    //         };
    //     } catch (error) {
    //         this.logger.error("Error verifying payment:", error);
    //         throw new BadRequestException(`Error verifying payment: ${error.message}`);
    //     }
    // }


    // async verify_payment(order_id: string, transaction_id: string): Promise<any> {
    //     const paystack_secret_key = this.config_service.get("PAYSTACK_SECRET_KEY");
    //     const paystack_verify_api = `https://api.paystack.co/transaction/verify/${transaction_id}`;
    
    //     try {
    //         // 🔹 Make API Request to Paystack for verification
    //         const response = await axios.get(paystack_verify_api, {
    //             headers: {
    //                 Authorization: `Bearer ${paystack_secret_key}`,
    //             },
    //         });
    
    //         // 🔹 Validate Response
    //         if (!response.data.status || response.data.data.status !== "success") {
    //             throw new BadRequestException("Payment verification failed");
    //         }
    
    //         // 🔹 Find Order
    //         const order = await this.order_model.findById(order_id);
    //         if (!order) {
    //             throw new NotFoundException("Order not found");
    //         }
    
    //         // 🔹 Update Order Status
    //         order.status = "Paid";
    //         await order.save();
    
    //         return {
    //             success: true,
    //             message: "Payment verified successfully!",
    //             data: order,
    //         };
    //     } catch (error) {
    //         this.logger.error("Error verifying Paystack payment:", error);
    //         throw new BadRequestException(`Error verifying payment: ${error.message}`);
    //     }
    // }
    
}
