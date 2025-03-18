import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/user.schema';
import { CloudinaryController } from 'src/utils/cloudinary/cloudinary.controller';
import { CloudinaryService } from 'src/utils/cloudinary/cloudinary.service';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: User.name,
      schema: UserSchema
    }])
  ],
  providers: [
    UsersService,
    CloudinaryService,
  ],
  controllers: [
    UsersController,
    CloudinaryController
  ],
  exports: [MongooseModule.forFeature([{
    name: User.name,
    schema: UserSchema
  }])]
})
export class UsersModule {}
