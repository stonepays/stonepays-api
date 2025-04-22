import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ExchangeRateDocument = ExchangeRate & Document;

@Schema({ timestamps: true })
export class ExchangeRate {
    @Prop({
        required: true,
    })
    exchange_rate: number;
}

export const ExchangeRateSchema = SchemaFactory.createForClass(ExchangeRate);