import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";



export class ResendOtpDto {
    @ApiProperty({
        example: 'example@mail.com'
    })
    @IsString()
    @IsNotEmpty()
    email: string;

}