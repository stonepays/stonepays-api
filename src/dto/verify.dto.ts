import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsNotEmpty } from "class-validator";

export class VerifyDto {
    @ApiProperty({
        example: "60d0fe4f5311236168a109ce",
        description: "User ID of the authenticated user",
    })
    @IsMongoId()
    @IsNotEmpty()
    user_id: string;
}
