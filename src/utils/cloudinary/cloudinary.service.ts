import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, ConfigOptions, UploadApiResponse } from 'cloudinary'



@Injectable()
export class CloudinaryService {
    constructor() {
        this.configureCloudinary();
    }

    private configureCloudinary() {
        const config: ConfigOptions = {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        };
        cloudinary.config(config);
    }

    async uploadImage(base64Image: string, publicId?: string): Promise<UploadApiResponse> {
        try {
            // Upload the image to Cloudinary
            const result = await cloudinary.uploader.upload(base64Image, {
                public_id: publicId,
                resource_type: 'image',
            });
    
            // Check if result contains a valid URL
            if (!result.secure_url) {
                throw new Error('Image upload successful, but no secure URL was returned.');
            }
    
            return result;
        } catch (error) {
            console.error('Cloudinary upload error:', error);
    
            // Provide more detailed error message from Cloudinary
            throw new Error(`Cloudinary upload failed: ${error.message || 'Unknown error'}`);
        }
    }
    
    

    getOptimizedUrl(publicId: string): string {
        return cloudinary.url(publicId, {
          fetch_format: 'auto',
          quality: 'auto',
        });
    }

    getTransformedUrl(publicId: string): string {
        return cloudinary.url(publicId, {
          crop: 'fill',
          gravity: 'face',
          width: 500,   
          height: 500,
        });
    }
      
}
