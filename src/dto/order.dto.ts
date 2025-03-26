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
    @IsMongoId()
    product_id: string;

    @ApiProperty({
        example: 2
    })
    @IsNumber()
    quantity: number;

    @ApiProperty({
        example: "digital product"
    })
    @IsString()
    product_category: string;

    @ApiProperty({
        example: 50
    })
    @IsNumber()
    price: number;
}

export class OrderDto {
    @ApiProperty({
        example: "60d0fe4f5311236168a109ce",
        description: "User ID (Required for authenticated users, optional for guests)",
    })
    @IsMongoId()
    @IsOptional() // ✅ User ID is optional for guests
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
    @ValidateNested({ each: true })
    @Type(() => ProductItemDto)
    products: ProductItemDto[];

    @ApiProperty({
        example: 100
    })
    @IsNumber()
    total_price: number;
}
