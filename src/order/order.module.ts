import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { User, UserSchema} from "src/schema/user.schema";
import { Product, ProductSchema } from 'src/schema/product.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{
      name: Order.name,
      schema: OrderSchema
    },
    {
      name: User.name,
      schema: UserSchema
    },
    {
      name: Product.name,
      schema: ProductSchema
    },
  ])
  ],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [
    MongooseModule.forFeature([{
      name: Order.name,
      schema: OrderSchema
    },
    {
      name: User.name,
      schema: UserSchema
    },
    {
      name: Product.name,
      schema: ProductSchema
    },
  ])
  ]
})
export class OrderModule {}
