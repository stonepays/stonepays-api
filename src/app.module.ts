import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CloudinaryModule } from './utils/cloudinary/cloudinary.module';
import { ProductModule } from './product/product.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { OrderModule } from './order/order.module';
import { PaymentsModule } from './payments/payments.module';

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
    ProductCategoryModule,
    OrderModule,
    PaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
