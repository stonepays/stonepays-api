import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from 'src/dto/sign-up.dto';
import { SignInDto } from 'src/dto/sign-in.dto';
import { VerifyOtpDto } from 'src/dto/verify-otp.dto';
import { ResendOtpDto } from 'src/dto/resend-otp.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';


@ApiTags('Auth')
@ApiBearerAuth('access-token') 
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign_up')
  @ApiOperation({
    summary: 'Enables new user to create account so as to access the application',
  })
  async signUp(
    @Body() dto: SignUpDto,
    @Body('user_img') base64_image?: string,
  ) {
    return this.authService.sign_up(dto, base64_image);
  }

  @Post('verify_otp')
  @ApiOperation({
    summary: 'Enable users to verify their email after sign up',
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Post('resend_otp')
  @ApiOperation({
    summary: 'Enable users to resend OTP for email verification',
  })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }

  @Post('sign_in')
  @ApiOperation({
    summary: 'Enable users to sign in to the application',
  })
  async signIn(@Body() dto: SignInDto) {
    return this.authService.sign_in(dto);
  }

  @UseGuards(AuthGuard)
  @Get('signed_in_user')
  @ApiOperation({
    summary: 'This API returns the signed-in user',
  })
  async getLoggedInUser(@Req() req) {
    return this.authService.getUserById(req.user._id);
  }


}