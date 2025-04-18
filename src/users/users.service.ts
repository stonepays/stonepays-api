import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SignUpDto } from 'src/dto/sign-up.dto';
import { User, UserDocument } from 'src/schema/user.schema';
import { CloudinaryService } from 'src/utils/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);


    constructor(
        @InjectModel(User.name) private user_model: Model<UserDocument>,
        private cloudinary_service: CloudinaryService,
    ) {}

    // update user
    async update_user(id: string, dto: Partial<SignUpDto>, base64_image?: string): Promise<any> {
        try {
            const existing_user = await this.user_model.findById(id).exec();
    
            if (!existing_user) {
                throw new BadRequestException('User does not exist');
            }
    
            let image_url = existing_user.user_img;
    
            // Handle base64 image upload if provided
            if (base64_image) {
                if (!base64_image.startsWith('data:image/')) {
                    throw new BadRequestException('Invalid user image. Provide a valid base64-encoded image');
                }
    
                try {
                    const public_id = `user_profiles/${Date.now()}`;
                    const upload_result = await this.cloudinary_service.uploadImage(base64_image, public_id);
                    image_url = upload_result.secure_url;
                } catch (error) {
                    this.logger.error('Error uploading user image', error);
                    throw new BadRequestException('Failed to upload user image', error);
                }
            }
    
            // Dynamically update fields from the DTO
            const updatableFields = ['first_name', 'last_name', 'email', 'password'];
            for (const field of updatableFields) {
                if (dto[field]) {
                    existing_user[field] = field === 'password' ? dto[field] : dto[field];
                }
            }
    
            // Update the user image if it was changed
            existing_user.user_img = image_url;
    
            await existing_user.save();
    
            return {
                success: true,
                message: 'User updated successfully!',
                data: existing_user,
            };
        } catch (error) {
            this.logger.error(`Error updating user: ${error.message}`);
            throw new BadRequestException('An error occurred while updating user.');
        }
    }


    // delete user
    async delete_user(id: string): Promise<any> {
        try {
            const delete_user = await this.user_model.findByIdAndDelete(id).exec();

            if (!delete_user) {
                throw new BadRequestException('User does not exist');
            }


            return {
                success: true,
                message: 'User deleted successfully!'
            }
        } catch (error) {
            this.logger.error(`Error deleting user: ${error.message}`);
            throw new BadRequestException('An error occured while deleting user');
        }
    }


    // get user by ID
    async get_user(id: string): Promise<any> {
        try {
            const user = await this.user_model.findById(id).exec();

            if (!user) {
                throw new BadRequestException('User does not exist');
            }

            return {
                success: true,
                message: 'User retrieved successfully!',
                data: user
            }
        } catch (error) {
            this.logger.error(`Error retrieving user: ${error.message}`);
            throw new BadRequestException('An error occured while retrieving the user.');
        }
    }


    // get users
    async get_users() {
        try {
            const users = await this.user_model.find().exec();

            return {
                success: true,
                message: 'Users retrieved successfully!',
                data: users
            }
        } catch (error) {
            this.logger.error(`Error retrieving users: ${error.message}`);
            throw new BadRequestException('An error occured while retrieving users.');            
        }
    }


    // ✅ Get Total User Count
    async get_total_user_count(): Promise<any> {
        try {
            const total_count = await this.user_model.countDocuments();
            return {
                success: true,
                message: "Total users count retrieved successfully",
                data: total_count
            };
        } catch (error) {
            this.logger.error("Error retrieving total users count:", error);
            throw new BadRequestException("Error retrieving total users count: " + error.message);
        }
    }


}
