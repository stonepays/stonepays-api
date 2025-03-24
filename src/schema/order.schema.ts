import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from './product.schema';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
    // ✅ User Details (Includes user_id and other details)
    @Prop({
        type: Object,
        required: false,
        default: null
    })
    user_details: {
        user_id: Types.ObjectId | null;
        first_name: string;
        last_name: string;
        email: string;
        user_img: string;
    } | null;

    // ✅ Temp Order ID (For guests)
    @Prop({
        type: Types.ObjectId,
        unique: true,
        sparse: true, 
        index: true    
    })
    temp_order_id: Types.ObjectId | null;

    // ✅ Products Ordered
    @Prop([{
        product_id: {
            type: Types.ObjectId,
            ref: "Product",
            required: true
        },
        product_details: {
            product_name: { type: String },
            product_category: { type: [String] }
        },
        quantity: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true
        },
    }])
    products: {
        product_id: Types.ObjectId;
        product_details: {
            product_name: string;
            product_category: string[];
        };
        quantity: number;
        price: number;
    }[];

    // ✅ Order Status
    @Prop({
        required: true,
        default: "Pending"
    })
    status: string;

    // ✅ Total Price
    @Prop({
        required: true
    })
    total_price: number;

    // ✅ Transaction Reference
    @Prop({
        type: String,
        unique: true,
        sparse: true,
        default: null
    })
    transaction_reference?: string; 

    // ✅ Payment Method
    @Prop({
        type: String,
        required: true,
        default: "paystack"
    })
    payment_method: string;

    // ✅ Payment Reference - Fixing Unique Constraint Issue
    @Prop({
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values
        index: true,
    })
    payment_reference?: string; 

    // ✅ Payment Date (Fixed)
    @Prop({
        type: Object,
        default: null
    })
    payment_date: Record<string, any> | null;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// ✅ Pre-save middleware to omit null values
OrderSchema.pre('save', function (next) {
    if (!this.payment_reference) {
        this.payment_reference = undefined; // Prevents MongoDB from storing `null`
    }
    next();
});
