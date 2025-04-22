import { Controller, Body, BadRequestException, Get, Param, Delete, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/roles.guard';
import { Role } from 'src/enum/roles.enum';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateDto } from 'src/dto/exchange-rate.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorstor';



@ApiTags('Exchange Rate')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RoleGuard)
@Controller('exchange-rate')
export class ExchangeRateController {
    constructor(
        private readonly exchange_rate_service: ExchangeRateService,
    ) {}

    @Post('create_exchange_rate')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This API create an exchange rate'
    })
    async create_exchange_rate(
        @Body() dto: ExchangeRateDto,
    ) {
        try {
            return this.exchange_rate_service.create_exchange_rate(dto);
        } catch (error) {
            throw new BadRequestException(`Error creating exchange rate ${error.message}`);
        }
    }

    @Get('get_all_exchange_rates')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This API get all exchange rates'
    })
    async get_all_exchange_rates() {
        try {
            return this.exchange_rate_service.get_all_exchange_rates();
        } catch (error) {
            throw new BadRequestException(`Error getting all exchange rates ${error.message}`);
        }
    }

    @Get('get_exchange_rate_by_id/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This API get an exchange rate by id'
    })
    async get_exchange_rate_by_id(@Param('id') id: string) {
        try {
            return this.exchange_rate_service.get_exchange_rate_by_id(id);
        } catch (error) {
            throw new BadRequestException(`Error getting exchange rate by id ${error.message}`);
        }
    }

    @Put('update_exchange_rate/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This API update an exchange rate by id'
    })
    async update_exchange_rate(@Param('id') id: string, @Body() dto: ExchangeRateDto) {
        try {
            return this.exchange_rate_service.update_exchange_rate(id, dto);
        } catch (error) {
            throw new BadRequestException(`Error updating exchange rate ${error.message}`);
        }
    }

    @Delete('delete_exchange_rate/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This API delete an exchange rate by id'
    })
    async delete_exchange_rate(@Param('id') id: string) {
        try {
            return this.exchange_rate_service.delete_exchange_rate(id);
        } catch (error) {
            throw new BadRequestException(`Error deleting exchange rate ${error.message}`);
        }
    }

    @Get('get_current_exchange_rate')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This API get the current exchange rate'
    })
    async get_current_exchange_rate() {
        try {
            return this.exchange_rate_service.get_current_exchange_rate();
        } catch (error) {
            throw new BadRequestException(`Error getting current exchange rate ${error.message}`);
        }
    }
}
