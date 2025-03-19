import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ProductDocument = Product & Document;

@Schema({
    timestamps: true
})
export class Product {

    @Prop({
        required: true,
        type: Types.ObjectId,
        ref: 'User'
    })
    user_id: Types.ObjectId;

    @Prop({
        required: true,
        unique: true,
    })
    product_name: string;

    @Prop({
        required: true,
        type: [{
            category: { type: String, required: true },
            id: { type: Types.ObjectId, required: true, ref: 'ProductCategory' }
        }],
        _id: false // ✅ Prevent MongoDB from adding an _id to each product_category entry
    })
    product_category: { category: string; id: Types.ObjectId }[];

    @Prop({
        required: true
    })
    product_price: number;

    @Prop({
        required: true
    })
    product_description: string;

    @Prop({
        required: true
    })
    product_img: string;

    @Prop({
        required: true,
    })
    product_qty: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
