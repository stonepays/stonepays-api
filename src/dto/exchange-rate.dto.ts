import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class ExchangeRateDto {
    @ApiProperty({
        example: 1.2,
    })
    @IsNotEmpty()
    @IsNumber()
    exchange_rate: number;
}