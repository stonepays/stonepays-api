import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";



export class ProductCategoryDto {
    @ApiProperty({
        example: 'digial product'
    })
    @IsNotEmpty()
    @IsString()
    category_name: string;


    @ApiProperty({
        example: 'this category is for digital products'
    })
    @IsNotEmpty()
    @IsString()
    category_description: string;

}