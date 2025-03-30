import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, Matches, MaxLength, MinLength, IsEmail } from 'class-validator';


export class SignUpDto {
    @ApiProperty({
        example: 'john'
    })
    @IsString()
    @IsNotEmpty()
    first_name: string;


    @ApiProperty({
        example: 'doe'
    })
    @IsString()
    @IsNotEmpty()
    last_name: string;


    @ApiProperty({
        example: 'example@mail.com'
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;


    
    @ApiProperty({
        example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA... (truncated)',
        description: 'Base64-encoded user profile image',
    })
    @IsString()
    @IsNotEmpty()
    user_img: string;


    @ApiProperty({
        example: 'P@ssword1'
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: "Password too short, it should be a minimum of 8 characters." })
    @MaxLength(15, { message: "Password too long, it should be a maximum of 15 characters." })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
        message: 'Password must include uppercase, lowercase, number, and special character.',
    })
    password: string;
    
}