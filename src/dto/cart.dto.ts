import { ApiProperty } from "@nestjs/swagger";
import {
    IsMongoId,
    IsOptional,
    IsNotEmpty,
    IsArray,
    ValidateNested,
    IsNumber,
    IsString
} from 'class-validator';
import { Type } from "class-transformer";

class ProductItemDto {
    @ApiProperty({
        example: "60d0fe4f5311236168a109ca"
    })
    @IsString()
    @IsMongoId()
    product_id: string;

    @ApiProperty({
        example: 2
    })
    @IsNumber()
    quantity: number;

    @ApiProperty({
        example: "60d0fe4f5311236168a109ca"
    })
    @IsMongoId()
    @IsString()
    product_category_id: string;

    @ApiProperty({
        example: 50
    })
    @IsNumber()
    price: number;
}

export class CartDto {
    @ApiProperty({
        example: "60d0fe4f5311236168a109ce",
        description: "User ID (Required for authenticated users, optional for guests)",
    })
    @IsMongoId()
    @IsNotEmpty() // ✅ User ID is optional for guests
    user_id?: string;

    @ApiProperty({
        example: "67da48daf7f3fe469e233233",
        description: "Temporary Order ID (Only for guest users)",
    })
    @IsMongoId()
    @IsOptional() // ✅ Only for guests
    temp_order_id?: string;

    @ApiProperty({
        type: [ProductItemDto],
        description: "List of products in the order",
    })
    @IsArray()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => ProductItemDto)
    products: ProductItemDto[];

    @ApiProperty({
        example: 100
    })
    @IsNumber()
    @IsNotEmpty()
    total_price: number;
}
