import { Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


export type ProductCategoryDocument = ProductCategory & Document;

@Schema({
    timestamps: true
})
export class ProductCategory {
    @Prop({
        required: true,
        unique: true
    })
    category_name: string;

    @Prop({
        required: true,
    })
    category_description: string;
}

export const ProductCategorySchema = SchemaFactory.createForClass(ProductCategory);