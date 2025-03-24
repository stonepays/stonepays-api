import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsNotEmpty, IsString, IsNumber, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";



export class ProductDto {

    @ApiProperty({ example: "iTunes" })
    @IsNotEmpty()
    @IsString()
    product_name: string;

    @ApiProperty({
        example: "digital product",
    })
    @IsNotEmpty()
    @IsString()
    product_category: string;

    @ApiProperty({ example: 1000 })
    @IsNotEmpty()
    @IsNumber()
    product_price: number;

    @ApiProperty({ example: "This is a nice product" })
    @IsNotEmpty()
    @IsString()
    product_description: string;

    @ApiProperty({
        example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        description: "Base64-encoded product image",
    })
    @IsNotEmpty()
    @IsString()
    product_img: string;

    @ApiProperty({ example: 100 })
    @IsNotEmpty()
    @IsNumber()
    product_qty: number;
}
