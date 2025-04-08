import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
    @Prop({
        required: true,
    })
    user_id: string;

    @Prop([{
        product_id: {
            type: String,
            required: true
        },
        product_category_id: {
            type: String,
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
        product_id: string;
        product_category_id: string;
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