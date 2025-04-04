import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/roles.guard';
import { Role } from 'src/enum/roles.enum';
import { ProductService } from './product.service';
import { ProductDto } from 'src/dto/product.dto';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorstor';




@ApiTags('Product')
@ApiBearerAuth('access-token')
@Controller('product')
export class ProductController {
    constructor(
        private readonly product: ProductService
    ) {}


    @Post('create_product')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This API create a product'
    })
    async create_product(
        @Body() dto: ProductDto,
        @Body('product_img') base64_image: string
    ) {
        try {
            return this.product.create_product(dto, base64_image);
        } catch (error) {
            throw new BadRequestException(`Error creating product ${error.message}`);
        }
    }


    @Put('update_product/:id')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This API updates a product'
    })
    async update_product(
        @Param('id') id: string,
        @Body() dto: ProductDto,
        @Body('product_img') base64_image: string
    ) {
        try {
            return this.product.update_product(dto, id, base64_image);
        } catch (error) {
            throw new BadRequestException(`Error updating product ${error.message}`);
        }
    }


    @Delete('delete_product/:id')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This api allows the admin user to delete an existing product'
    })
    async delete_product(
        @Param('id') id: string
    ): Promise<any> {
        try {
            return this.product.delete_product(id);
        } catch (error) {
            throw new BadRequestException(`Error deleting product ${error.message}`);
        }
    }


    @Get('get_product/:id')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({
        summary: 'This api gets an existing product by id'
    })
    async get_product(
        @Param('id') id: string
    ): Promise<any> {
        try {
            return this.product.get_product_by_id(id);
        } catch (error) {
            throw new BadRequestException(`Error retrieving product details: ${error.message}`);
        }
    }

    @Get('get_products/:product_category_id')
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({
        summary: 'Get products by category ID',
    })

    async getProductsByCategory(
        @Param('product_category_id') product_category_id: string
    ) {
        try {
            return await this.product.get_product_by_category(product_category_id);
        } catch (error) {
            throw new BadRequestException(`Error retrieving products: ${error.message}`);
        }
    }


    @Get('total_count')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'Gets the total product count for dashboard',
    })
    async getTotalProductCount() {
        try {      
            return this.product.get_total_product_count();
        } catch (error) {
            throw new BadRequestException(`Error attaching product: ${error.message}`);
        }
    }
}
