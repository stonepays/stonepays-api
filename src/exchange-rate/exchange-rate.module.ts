import { Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ExchangeRate, ExchangeRateSchema } from 'src/schema/exchange-rate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: ExchangeRate.name,
      schema: ExchangeRateSchema
    }])
  ],
  providers: [ExchangeRateService],
  controllers: [ExchangeRateController],
  exports: [
    MongooseModule.forFeature([{
      name: ExchangeRate.name,
      schema: ExchangeRateSchema
    }])
  ]
})
export class ExchangeRateModule {}
