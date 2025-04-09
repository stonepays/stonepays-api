import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from 'src/schema/cart.schema';
import { User, UserSchema } from 'src/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Cart.name,
        schema: CartSchema
      },{
        name: User.name,
        schema: UserSchema
      }
  ])
  ],
  providers: [CartService],
  controllers: [CartController],
  exports: [
    MongooseModule.forFeature([
      {
        name: Cart.name,
        schema: CartSchema
      },{
        name: User.name,
        schema: UserSchema
      }
  ])
  ],
})
export class CartModule {}
