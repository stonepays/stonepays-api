import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/roles.guard';
import { Role } from 'src/enum/roles.enum';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryDto } from 'src/dto/product-category.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorstor';


@UseGuards(AuthGuard, RoleGuard)
@ApiTags('Product-Category')
@ApiBearerAuth('access-token')
@Controller('product-category')
export class ProductCategoryController {
    constructor(
        private readonly product_category: ProductCategoryService
    ) {}

    @Post('create_product_category')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This API create a product category'
    })
    async create_product_category(
        @Body() dto: ProductCategoryDto,
    ) {
        try {
            return this.product_category.create_product_category(dto);
        } catch (error) {
            throw new BadRequestException(`Error creating product category ${error.message}`);
        }
    }


    @Put('update_product_category/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This API updates a product category'
    })
    async update_product_category(
        @Param('id') id: string,
        @Body() dto: ProductCategoryDto,
    ) {
        try {
            return this.product_category.update_product_category(id, dto);
        } catch (error) {
            throw new BadRequestException(`Error updating product ${error.message}`);
        }
    }


    @Delete('delete_product_category/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This api allows the admin user to delete an existing product category'
    })
    async delete_product_category(
        @Param('id') id: string
    ): Promise<any> {
        try {
            return this.product_category.delete_product_category(id);
        } catch (error) {
            throw new BadRequestException(`Error deleting product category ${error.message}`);
        }
    }


    @Get('get_product_category/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This api gets an existing product category by id'
    })
    async get_product_category(
        @Param('id') id: string
    ): Promise<any> {
        try {
            return this.product_category.get_product_category(id);
        } catch (error) {
            throw new BadRequestException(`Error retrieving product category details: ${error.message}`);
        }
    }

    

    @Get('get_product_categoryies')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This api gets all existing product categories'
    })
    async get_product_categories(
    ): Promise<any> {
        try {
            return this.product_category.get_product_categories();
        } catch (error) {
            throw new BadRequestException(`Error retrieving product categories: ${error.message}`);
        }
    }
}
