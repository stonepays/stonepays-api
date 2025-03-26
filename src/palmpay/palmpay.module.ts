import { Module } from '@nestjs/common';
import { PalmpayService } from './palmpay.service';
import { PalmpayController } from './palmpay.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
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
  ]),
  HttpModule,
  ConfigModule
],
  providers: [PalmpayService],
  controllers: [PalmpayController],
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
export class PalmpayModule {}
