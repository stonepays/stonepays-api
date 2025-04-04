import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { ProductCategory } from "./product-category.schema";


export type ProductDocument = Product & Document;

@Schema({
    timestamps: true
})
export class Product {

    @Prop({
        required: true,
        unique: true,
    })
    product_name: string;


    @Prop({
        required: true,
        type: Types.ObjectId,
        ref: "ProductCategory"
    })
    product_category_id: Types.ObjectId;

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
