import { 
    BadRequestException, 
    Body, 
    Controller, 
    Delete, 
    Get, 
    Param, 
    Post, 
    Put, 
    UseGuards 
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/roles.guard';
import { Role } from 'src/enum/roles.enum';
import { OrderService } from './order.service';
import { OrderDto } from 'src/dto/order.dto';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorstor';


@UseGuards(AuthGuard, RoleGuard)
@ApiTags('Order')
@ApiBearerAuth('access-token')
@Controller('order')
export class OrderController {
    constructor(
        private readonly order_service: OrderService
    ) {}

    // ✅ Create Order (Guest or Authenticated User)
    @Post('create_order')
    @ApiOperation({
        summary: 'Create an order (Guest or Authenticated User)',
    })
    async create_order(
        @Body() dto: OrderDto
    ) {
        try {
            return this.order_service.create_order(dto);
        } catch (error) {
            throw new BadRequestException(`Error creating order: ${error.message}`);
        }
    }

    // ✅ Get Order by ID
    @Get('get_order/:id')
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({
        summary: 'Retrieve an order by ID',
    })
    @ApiParam({
        name: 'id',
        required: true,
        example: '64f5c8b7a3e7a8d7b6f5e4c3',
        description: 'The ID of the order',
    })
    async get_order(
        @Param('id') id: string
    ) {
        try {
            return this.order_service.get_order_by_id(id);
        } catch (error) {
            throw new BadRequestException(`Error retrieving order: ${error.message}`);
        }
    }

    // ✅ Get All Orders (Admin only)
    @Get('get_orders')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'Retrieve all orders (Admin only)',
    })
    async get_orders() {
        try {
            return this.order_service.get_orders();
        } catch (error) {
            throw new BadRequestException(`Error retrieving orders: ${error.message}`);
        }
    }

    // ✅ Update Order
    @Put('update_order/:id')
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({
        summary: 'Update an existing order',
    })
    async update_order(
        @Param('id') id: string,
        @Body() dto: OrderDto
    ) {
        try {
            return this.order_service.update_order(id, dto);
        } catch (error) {
            throw new BadRequestException(`Error updating order: ${error.message}`);
        }
    }

    // ✅ Delete Order
    @Delete('delete_order/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'Delete an order',
    })
    async delete_order(
        @Param('id') id: string
    ) {
        try {
            return this.order_service.delete_order(id);
        } catch (error) {
            throw new BadRequestException(`Error deleting order: ${error.message}`);
        }
    }

    // ✅ Attach Order to User After Sign-up
    @Post('attach_order_to_user')
    @ApiOperation({
        summary: 'Attach a guest order to an authenticated user after sign-up',
    })
    async attach_order_to_user(
        @Body('user_id') user_id: string,
        @Body('temp_order_id') temp_order_id: string
    ) {
        try {
            return this.order_service.attach_order_to_user(user_id, temp_order_id);
        } catch (error) {
            throw new BadRequestException(`Error attaching order: ${error.message}`);
        }
    }

    // @Post("checkout_order/:order_id")
    // @Roles(Role.USER)
    // @ApiOperation({
    //     summary: "Proceed to checkout with PalmPay payment",
    // })
    // @ApiParam({
    //     name: "order_id",
    //     required: true,
    //     example: "64f5c8b7a3e7a8d7b6f5e4c3",
    //     description: "The ID of the order to be checked out",
    // })
    // async checkout_order(
    //     @Param("order_id") order_id: string,
    //     @Body() checkoutDto: CheckoutOrderDto
    // ) {
    //     try {
    //         return await this.order_service.check_out_order(order_id, checkoutDto);
    //     } catch (error) {
    //         throw new BadRequestException(`Error checking out order: ${error.message}`);
    //     }
    // }


    // // ✅ Verify PalmPay Payment
    // @Post('verify_payment')
    // @Roles(Role.ADMIN, Role.USER)
    // @ApiOperation({
    //     summary: 'Verify payment after PalmPay transaction callback',
    // })
    // async verify_payment(
    //     @Body('order_id') order_id: string,
    //     @Body('transaction_id') transaction_id: string
    // ) {
    //     try {
    //         return this.order_service.verify_payment(order_id, transaction_id);
    //     } catch (error) {
    //         throw new BadRequestException(`Error verifying payment: ${error.message}`);
    //     }
    // }
}
