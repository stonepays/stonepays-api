import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Order, OrderDocument } from 'src/schema/order.schema';
import { User, UserDocument } from 'src/schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Request, Response } from 'express';
import * as crypto from "crypto"

@Injectable()
export class PaymentsService {
    constructor(
        @InjectModel(Order.name) private order_model: Model<OrderDocument>,
        @InjectModel(User.name) private user_model: Model<UserDocument>,
        private config_service: ConfigService
    ) {}

    async initialize_payment(order_id: string): Promise<any> {
        const order = await this.order_model.findById(order_id).exec();
        if (!order) throw new BadRequestException("Order not found");
        if (order.status === "Paid") throw new BadRequestException("Order has already been paid");

        const user = await this.user_model.findById(order.user_details.user_id);
        if (!user) throw new BadRequestException("User not found");

        try {
            const api = this.config_service.get<string>("PAYSTACK_INITIATE_PAYMENT_API");
            const callback_url = this.config_service.get<string>("PAYSTACK_REDIRECT_URL");
            const secret_key = this.config_service.get<string>("PAYSTACK_SECRET_KEY");

            if (!api || !callback_url || !secret_key) {
                throw new Error("Missing Paystack configuration keys");
            }

            const transaction_reference = `ORDER_${order_id}_${Date.now()}`;
            const response = await axios.post(
                `${api}/transaction/initialize`,
                {
                    email: user.email,
                    amount: order.total_price * 100,
                    currency: "NGN",
                    callback_url,
                    reference: transaction_reference,
                },
                {
                    headers: {
                        Authorization: `Bearer ${secret_key}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.data?.data) throw new Error("Invalid response from Paystack");

            console.log("🔹 Saving order with reference:", transaction_reference);
            order.transaction_reference = transaction_reference;
            await order.save();

            return {
                success: true,
                message: 'Redirect to Paystack for payment',
                payment_url: response.data.data.authorization_url,
                reference: response.data.data.reference,
            };
        } catch (error) {
            console.error("🚨 Paystack API Error:", error.response?.data || error.message);
            throw new HttpException(
                error.response?.data?.message || 'Error initializing payment',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    async verify_payment(reference: string, user_id?: string): Promise<any> {
        try {
            const secret_key = this.config_service.get<string>("PAYSTACK_SECRET_KEY");
            if (!secret_key) throw new Error("Missing PAYSTACK_SECRET_KEY in .env");

            console.log("🔍 Verifying Paystack payment for:", reference);
            const response = await axios.get(
                `https://api.paystack.co/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${secret_key}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.data?.data) throw new Error("Invalid response from Paystack");

            const transaction = response.data.data;
            if (transaction.status !== "success") {
                return {
                    success: false,
                    message: `Payment verification failed: ${transaction.gateway_response}`,
                    data: transaction,
                };
            }

            console.log("🔍 Searching for order with reference:", reference);
            let order = await this.order_model.findOne({ transaction_reference: reference });

            if (!order && user_id) {
                order = await this.order_model.findOne({ user_id, transaction_reference: reference });
            }

            if (!order) {
                throw new NotFoundException("Order not found for this reference");
            }

            order.status = "Paid";
            order.payment_reference = reference;
            order.payment_date = new Date();
            await order.save();

            return {
                success: true,
                message: "🎉 Payment verified successfully",
                data: transaction,
            };
        } catch (error) {
            console.error("⚠️ Paystack Verification Error:", error.response?.data || error.message);
            throw new HttpException(
                error.response?.data?.message || "Error verifying payment",
                HttpStatus.BAD_REQUEST
            );
        }
    }


// async handle_paystack_webhook(req: Request, res: Response) {
//     try {
//         const secret = this.config_service.get<string>("PAYSTACK_SECRET_KEY");
//         if (!secret) {
//             console.error("🚨 Missing PAYSTACK_SECRET_KEY in environment variables.");
//             return res.status(500).json({ success: false, message: "Server configuration error" });
//         }

//         // 🔍 Validate Paystack Signature
//         const paystackSignature = req.headers["x-paystack-signature"] as string;
//         const hash = crypto.createHmac('sha512', secret)
//                            .update(JSON.stringify(req.body))
//                            .digest('hex');

//         if (paystackSignature !== hash) {
//             console.warn("⚠️ Invalid Paystack signature");
//             return res.status(400).json({ success: false, message: "Invalid signature" });
//         }

//         console.log("🔹 Valid Paystack webhook received:", req.body);

//         const { event, data } = req.body;

//         if (event !== "charge.success") {
//             console.log("ℹ️ Ignored event:", event);
//             return res.status(200).json({ success: true, message: "Event ignored" });
//         }

//         const transaction_reference = data?.reference;
//         if (!transaction_reference) {
//             return res.status(400).json({ success: false, message: "Missing transaction reference" });
//         }

//         console.log("🔍 Webhook processing order with reference:", transaction_reference);
//         const order = await this.order_model.findOne({ transaction_reference }).exec();

//         if (!order) {
//             console.error("❌ Order not found for reference:", transaction_reference);
//             return res.status(404).json({ success: false, message: "Order not found" });
//         }

//         if (order.status === "Paid") {
//             console.log("✔️ Order already marked as paid, skipping:", order._id);
//             return res.status(200).json({ success: true, message: "Order already processed" });
//         }

//         order.status = "Paid";
//         order.payment_date = new Date();
//         await order.save();

//         console.log("✅ Order updated successfully:", order._id);

//         return res.status(200).json({
//             success: true,
//             message: "Order payment verified successfully",
//         });
//     } catch (error) {
//         console.error("🚨 Webhook processing error:", error);
//         return res.status(500).json({ success: false, message: "Webhook processing failed" });
//     }
// }

}
