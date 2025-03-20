import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { User, UserSchema } from 'src/schema/user.schema';

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
  providers: [PaymentsService],
  controllers: [PaymentsController],
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
export class PaymentsModule {}
