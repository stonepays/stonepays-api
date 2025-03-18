import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Controller('cloudinary')
export class CloudinaryController {
    constructor(private readonly cloudinaryService: CloudinaryService) {}


    @Post('upload')
    async uploadImage(@Body('base64Image') base64Image: string) {
        if (!base64Image || !base64Image.startsWith('data:image/')) {
            throw new BadRequestException('Invalid image format. Please provide a base64-encoded image.');
        }

        try {
            const publicId = `user_profile/${Date.now()}`;
            const result = await this.cloudinaryService.uploadImage(base64Image, publicId);

            const optimizedUrl = this.cloudinaryService.getOptimizedUrl(result.public_id)

            const transformedUrl = this.cloudinaryService.getTransformedUrl(result.public_id);

            return {
                message: 'Image upload successful.',
                uploadResult: result,
                optimizedUrl,
                transformedUrl,
            };
        } catch (error) {
            console.error('Error uploading image:', error);
            throw new BadRequestException('Failed to upload image to Cloudinary.');
        }
    }
}
