import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsNotEmpty, IsString, IsNumber, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class ProductCategoryDto {
    @ApiProperty({ example: "Electronics" })
    @IsNotEmpty()
    @IsString()
    category: string;

    @ApiProperty({ example: "65b12345678bcdef12345678" })
    @IsNotEmpty()
    @IsMongoId()
    id: string;
}

export class ProductDto {

    @ApiProperty({ example: "iTunes" })
    @IsNotEmpty()
    @IsString()
    product_name: string;

    @ApiProperty({
        example: [{ category: "Electronics", id: "65b12345678bcdef12345678" }],
        type: [ProductCategoryDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductCategoryDto)
    product_category: ProductCategoryDto[];

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
