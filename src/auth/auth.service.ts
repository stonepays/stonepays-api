import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    UnauthorizedException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { JwtService } from '@nestjs/jwt';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model } from 'mongoose';
  import { SignUpDto } from 'src/dto/sign-up.dto';
  import { SignInDto } from 'src/dto/sign-in.dto';
  import { User, UserDocument } from 'src/schema/user.schema';
  import * as argon from 'argon2';
  import * as nodemailer from 'nodemailer';
  import { CloudinaryService } from 'src/utils/cloudinary/cloudinary.service';
  
  @Injectable()
  export class AuthService {
    private readonly logger = new Logger(AuthService.name);
  
    constructor(
      @InjectModel(User.name)
      private readonly userModel: Model<UserDocument>,
      private readonly jwt: JwtService,
      private readonly config: ConfigService,
      private cloudinary_service: CloudinaryService,
    ) {}
  
    // User registration (Sign-up)
    async sign_up(dto: SignUpDto, base64_image: string) {
      let image_url: string;

      // validate image input
      if (!base64_image || !base64_image.startsWith('data:image/')) {
        throw new BadRequestException('Invalid user image. Please provide a valid base64-encoded image');
      }


      try {
        const public_id = `user_profiles/${Date.now()}`;
        const upload_result = await this.cloudinary_service.uploadImage(base64_image, public_id);
        image_url = upload_result.secure_url;
      } catch (error) {
        this.logger.error('Error uploading user image:', error);
        throw new BadRequestException('Failed to upload user image');
      }
      const hash = await argon.hash(dto.password);
  
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
      const user = new this.userModel({
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        role: dto.role,
        user_img: image_url,
        hash,
        otp,
        otpExpiresAt,
        is_verified: false,
      });
  
      try {
        await this.sendOtpEmail(dto.email, otp, dto.first_name);
        await user.save();
  
        return {
          message: 'Registration successful. Please verify your email with the OTP sent.',
        };
      } catch (error) {
        this.logger.error('Error creating user:', error);
  
        if (error.code === 11000) {
          throw new ForbiddenException('User with this email already exists.');
        }
  
        throw new BadRequestException('An error occurred while creating the user.');
      }
    }
  
    // Send OTP via email
    async sendOtpEmail(email: string, otp: string, first_name: string) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.config.get('EMAIL_USER'),
          pass: this.config.get('EMAIL_PASS'),
        },
      });
  
      const mailOptions = {
        from: this.config.get('EMAIL_USER'),
        to: email,
        subject: 'Email Verification OTP',
        text: `Dear ${first_name}, your OTP for email verification is: ${otp}.`,
      };
  
      try {
        await transporter.sendMail(mailOptions);
        this.logger.log(`OTP sent to ${email}`);
      } catch (error) {
        this.logger.error('Error sending OTP email:', error);
        throw new BadRequestException('Failed to send OTP to email.');
      }
    }
  
    // Verify OTP
    async verifyOtp(email: string, otp: string) {
      const user = await this.userModel.findOne({ email });
  
      if (!user) {
        throw new UnauthorizedException('User not found.');
      }
  
      if (user.is_verified) {
        throw new BadRequestException('User is already verified.');
      }
  
      if (user.otp !== otp || user.otp_expires_at < new Date()) {
        throw new BadRequestException('Invalid or expired OTP.');
      }
  
      user.is_verified = true;
      user.otp = undefined;
      user.otp_expires_at = undefined;
  
      await user.save();
  
      return {
        message: 'Email verification successful. You can now proceed to sign in.',
      };
    }
  
    // Resend OTP
    async resendOtp(email: string) {
      const user = await this.userModel.findOne({ email });
  
      if (!user) {
        throw new UnauthorizedException('User not found.');
      }
  
      if (user.is_verified) {
        throw new BadRequestException('User is already verified.');
      }
  
      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const newOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
      user.otp = newOtp;
      user.otp_expires_at = newOtpExpiresAt;
  
      await user.save();
  
      try {
        await this.sendOtpEmail(email, newOtp, user.first_name);
        return {
          message: 'OTP has been resent to your email.',
        };
      } catch (error) {
        throw new BadRequestException('Failed to resend OTP.');
      }
    }
  
    // User sign-in
    async sign_in(dto: SignInDto) {
      const user = await this.userModel.findOne({ email: dto.email });
  
      if (!user) {
        throw new UnauthorizedException('Invalid credentials.');
      }
  
      if (!user.is_verified) {
        throw new UnauthorizedException('Please verify your email before signing in.');
      }
  
      const validPassword = await argon.verify(user.hash, dto.password);
  
      if (!validPassword) {
        throw new UnauthorizedException('Invalid credentials.');
      }
  
      const token = await this.generateToken(user.email, user.id, user.role);
  
      // Exclude the hash from the returned user data
    //   const userData = user.toObject();
    //   delete userData.hash;
  
      return {
        message: 'Sign in successful.',
        data: user,
        token,
      };
    }
  
    // Token generation
    async generateToken(email: string, userId: string, role: string): Promise<{ access_token: string }> {
      const payload = {
        sub: userId,
        email,
        role,
      };
  
      const secret = this.config.get('JWT_SECRET');
      const token = await this.jwt.signAsync(payload, {
        expiresIn: '30m',
        secret,
      });
  
      return {
        access_token: token,
      };
    }
  

    async getUserById(userId: string) {
      const user = await this.userModel.findById(userId).select('-hash'); // Exclude password hash
      if (!user) {
        throw new UnauthorizedException('User not found.');
      }
      return user;
    }
        

    
   
}