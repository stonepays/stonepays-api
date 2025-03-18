import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from 'src/utils/cloudinary/cloudinary.service';
import { CloudinaryController } from 'src/utils/cloudinary/cloudinary.controller';



@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({}), 
    ConfigModule, 
  ],
  controllers: [
    AuthController,
    CloudinaryController
  ],
  providers: [
    AuthService,
    JwtStrategy,
    CloudinaryService
  ],
  exports: [AuthService],
})
export class AuthModule {}
