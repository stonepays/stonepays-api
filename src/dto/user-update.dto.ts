import { IsOptional, IsString, IsEmail, Matches, MaxLength, MinLength } from 'class-validator';

export class UserUpdateDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password too short, it should be a minimum of 8 characters.' })
  @MaxLength(15, { message: 'Password too long, it should be a maximum of 15 characters.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/, {
    message: 'Password must include uppercase, lowercase, number, and special character.',
  })
  password?: string;
}