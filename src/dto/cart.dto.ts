import { ApiProperty } from "@nestjs/swagger";
import {
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
    product_id: string;

    @ApiProperty({
        example: 2
    })
    @IsNumber()
    quantity: number;

    @ApiProperty({
        example: "60d0fe4f5311236168a109ca"
    })
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
    })
    @IsNotEmpty() 
    user_id?: string;

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
