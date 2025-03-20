import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { User, UserSchema} from "src/schema/user.schema";


@Module({
  imports: [
    MongooseModule.forFeature([{
      name: Order.name,
      schema: OrderSchema
    },
    {
      name: User.name,
      schema: UserSchema
    }
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
    }
  ])
  ]
})
export class OrderModule {}
