import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CloudinaryModule } from './utils/cloudinary/cloudinary.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { PaymentsModule } from './payments/payments.module';
import { PalmpayModule } from './palmpay/palmpay.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI')
      })
    }),
    AuthModule,
    UsersModule,
    CloudinaryModule,
    ProductModule,
    OrderModule,
    PaymentsModule,
    PalmpayModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
