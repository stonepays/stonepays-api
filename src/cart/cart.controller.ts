import { Controller, BadRequestException, Body, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/roles.guard';
import { Role } from 'src/enum/roles.enum';
import { CartService } from './cart.service';
import { CartDto } from 'src/dto/cart.dto';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorstor';




@ApiTags('Cart')
@ApiBearerAuth('access-token')
@Controller('cart')
export class CartController {
    constructor(
        private readonly cart: CartService
    ) {}


    @Post('add_cart')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({
        summary: 'This api adds product to cart'
    })
    async add_cart(
        @Body() dto: CartDto,
    ) {
        try {
            return this.cart.add_to_cart(dto);
        } catch (error) {
            throw new BadRequestException(`Error adding to cart ${error.message}`);
        }
    }

    @Put('update_cart')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({
        summary: 'This api update products in a cart'
    })
    async update_cart(
        @Body() dto: CartDto,
    ) {
        try {
            return this.cart.update_cart(dto);
        } catch (error) {
            throw new BadRequestException(`Error adding to cart ${error.message}`);
        }
    }


    @Get('get_cart/:user_id')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({
        summary: 'This api gets product in a cart'
    })
    async get_cart(
        @Param('user_id') user_id: string 
    ) {
        try {
            return this.get_cart(user_id);
        } catch (error) {
            throw new BadRequestException(`Error retrieving cart: ${error.message}`);
        }
    }


    @Delete('remove_product_cart/:user_id/:product_id')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({
        summary: 'This api removes a product from cart'
    })
    async remove_product_cart(
        @Param('user_id') user_id: string,
        @Param('product_id') product_id: string
    ): Promise<any> {
        try {
            return this.cart.remove_from_cart(user_id, product_id);
        } catch (error) {
            throw new BadRequestException(`Error removing product cart ${error.message}`);
        }
    }


    @Delete('clear_cart/:user_id')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({
        summary: 'This api deletes cart'
    })
    async clear_cart(
        @Param('user_id') user_id: string,
    ): Promise<any> {
        try {
            return this.cart.clear_cart(user_id);
        } catch (error) {
            throw new BadRequestException(`Error removing product cart ${error.message}`);
        }
    }

}
