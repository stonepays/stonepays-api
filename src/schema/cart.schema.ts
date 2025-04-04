import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Product } from "./product.schema";
import { User } from "./user.schema";


export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
    @Prop({
        required: true,
        type: Types.ObjectId,
        ref: "User"
    })
    user_id: Types.ObjectId;

  
    @Prop({
        type: Types.ObjectId,
        unique: true,
        sparse: true, 
        index: true    
    })
    temp_order_id: Types.ObjectId | null;

  
    @Prop([{
        product_id: {
            type: Types.ObjectId,
            ref: "Product",
            required: true
        },
        product_category_id: {
            type: String,
            ref: "Product",
            required: true
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
        product_category_id: Types.ObjectId;
        quantity: number;
        price: number;
    }[];

  
    @Prop({
        required: true,
        default: "Pending"
    })
    status: string;


    @Prop({
        required: true
    })
    total_price: number;


}

export const CartSchema = SchemaFactory.createForClass(Cart);