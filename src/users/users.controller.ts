import { BadRequestException, Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/roles.guard';
import { UsersService } from './users.service';
import { Roles } from 'src/decorators/roles.decorstor';
import { Role } from 'src/enum/roles.enum';
import { SignUpDto } from 'src/dto/sign-up.dto';



@UseGuards(AuthGuard, RoleGuard)
@ApiTags('Users')
@ApiBearerAuth('access-token') 
@Controller('users')
export class UsersController {
    constructor(
        private readonly user_service: UsersService
    ) {}

    @Put('update_user/:id')
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({
        summary: 'This api allows users to update their profile'
    })
    async update_user(
        @Param('id') id: string,
        @Body() dto: SignUpDto,
        @Body('user_img') base64_image?: string,
    ): Promise<any> {
        try {
            return await this.user_service.update_user(id, dto, base64_image)
        } catch (error) {
            throw new BadRequestException(`Error updating user ${error.message}`);
        }
    }


    @Delete('delete_user/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This api allows the admin user to delete an existing user'
    })
    async delete_user(
        @Param('id') id: string
    ): Promise<any> {
        try {
            return this.user_service.delete_user(id);
        } catch (error) {
            throw new BadRequestException(`Error deleting user ${error.message}`);
        }
    }



    @Get('get_user/:id')
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({
        summary: 'This api gets an existing user by id'
    })
    async get_user(
        @Param('id') id: string
    ): Promise<any> {
        try {
            return this.user_service.get_user(id);
        } catch (error) {
            throw new BadRequestException(`Error retrieving user details: ${error.message}`);
        }
    }


    @Get('get_users')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'This api gets all the existing users'
    })
    async get_users() {
        try {
            return this.user_service.get_users();
        } catch (error) {
            throw new BadRequestException(`Error retrieving users: ${error.message}`);
        }
    }
}
