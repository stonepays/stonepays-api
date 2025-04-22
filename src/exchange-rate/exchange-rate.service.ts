import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExchangeRateDto } from 'src/dto/exchange-rate.dto';
import { ExchangeRate, ExchangeRateDocument } from 'src/schema/exchange-rate.schema';

@Injectable()
export class ExchangeRateService {
    private readonly logger = new Logger(ExchangeRateService.name);

    constructor(
        @InjectModel(ExchangeRate.name) private exchange_rate_model: Model<ExchangeRateDocument>,
    ) {}

    // create exchange rate
    async create_exchange_rate(dto: ExchangeRateDto) {
        try {
            const exchange_rate = new this.exchange_rate_model(dto);
            const saved_exchange_rate = await exchange_rate.save();

            return {
                success: true,
                message: 'Exchange rate created successfully!',
                data: saved_exchange_rate,
            };
        } catch (error) {
            this.logger.error(`Error creating exchange rate: ${error.message}`);
            throw new BadRequestException('Error creating exchange rate, try again');
        }
    }

    // get all exchange rates
    async get_all_exchange_rates() {
        try {
            const exchange_rates = await this.exchange_rate_model.find({}).sort({ createdAt: -1 });
            if (!exchange_rates || exchange_rates.length === 0) {
                throw new BadRequestException('No exchange rates found');
            }
            return {
                success: true,
                message: 'Exchange rates retrieved successfully!',
                data: exchange_rates,
            }
        } catch (error) {
            this.logger.error(`Error retrieving exchange rates: ${error.message}`);
            throw new BadRequestException('Error retrieving exchange rates, try again');
        }
    }

    // get exchange rate by id
    async get_exchange_rate_by_id(id: string) {
        try {
            const exchange_rate = await this.exchange_rate_model.findById(id);
            if (!exchange_rate) {
                throw new BadRequestException('Exchange rate not found');
            }
            return {
                success: true,
                message: 'Exchange rate retrieved successfully!',
                data: exchange_rate,
            }
        } catch (error) {
            this.logger.error(`Error retrieving exchange rate by ID: ${error.message}`);
            throw new BadRequestException('Error retrieving exchange rate, try again');
        }
    }

    // get current exchange rate
    async get_current_exchange_rate() {
        try {
            const exchange_rate = await this.exchange_rate_model.findOne({}).sort({ createdAt: -1 });
            if (!exchange_rate) {
                throw new BadRequestException('Exchange rate not found');
            }
            return {
                success: true,
                message: 'Current exchange rate retrieved successfully!',
                data: exchange_rate,
            }
        } catch (error) {
            this.logger.error(`Error retrieving current exchange rate: ${error.message}`);
            throw new BadRequestException('Error retrieving current exchange rate, try again');
        }
    }


    // update exchange rate
    async update_exchange_rate(id: string, dto: ExchangeRateDto) {
        try {
            const exchange_rate = await this.exchange_rate_model.findById(id);
            if (!exchange_rate) {
                throw new BadRequestException('Exchange rate not found');
            }
            const updated_exchange_rate = await this.exchange_rate_model.findByIdAndUpdate(id, dto, { new: true });
            return {
                success: true,
                message: 'Exchange rate updated successfully!',
            }
        } catch (error) {
            this.logger.error(`Error updating exchange rate: ${error.message}`);
            throw new BadRequestException('Error updating exchange rate, try again');
        }
    }


    // delete exchange rate
    async delete_exchange_rate(id: string) {
        try {
            const exchange_rate = await this.exchange_rate_model.findByIdAndDelete(id);
            if (!exchange_rate) {
                throw new BadRequestException('Exchange rate not found');
            }
            return {
                success: true,
                message: 'Exchange rate deleted successfully!',
            }
        } catch (error) {
            this.logger.error(`Error deleting exchange rate: ${error.message}`);
            throw new BadRequestException('Error deleting exchange rate, try again');
        }
    }

}
