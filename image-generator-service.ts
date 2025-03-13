// backend/src/services/images/generator.ts
import axios from 'axios';
import { createLogger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';

const logger = createLogger('image-generator');

// S3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Interface for image generation options
export interface ImageGenerationOptions {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
  numberOfImages?: number;
}

// Abstract base class for image generation services
abstract class ImageGenerationService {
  abstract generateImage(options: ImageGenerationOptions): Promise<string[]>;
}

// FLUX API implementation
export class FluxImageService extends ImageGenerationService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.FLUX_API_KEY || '';
    this.baseUrl = 'https://api.flux.ai/v1/images/generations';
  }

  async generateImage(options: ImageGenerationOptions): Promise<string[]> {
    try {
      logger.info(`Generating image with FLUX API for prompt: ${options.prompt}`);
      
      const response = await axios.post(
        this.baseUrl,
        {
          prompt: options.prompt,
          style: options.style || 'photographic',
          width: options.width || 1024,
          height: options.height || 768,
          num_images: options.numberOfImages || 1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.images) {
        // Process the image URLs - in a real implementation, you might want to download them
        // and upload to your own storage
        return await this.processImageUrls(response.data.images);
      }
      
      throw new Error('No images returned from FLUX API');
    } catch (error: any) {
      logger.error('Error generating image with FLUX:', error);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  private async processImageUrls(imageUrls: string[]): Promise<string[]> {
    const processedUrls: string[] = [];
    
    for (const url of imageUrls) {
      try {
        // Download the image
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        
        // Generate a unique filename
        const filename = `${uuidv4()}.jpg`;
        
        // Upload to S3
        const uploadResult = await s3.upload({
          Bucket: process.env.AWS_BUCKET_NAME || 'textbuilder-images',
          Key: filename,
          Body: buffer,
          ContentType: 'image/jpeg',
          ACL: 'public-read'
        }).promise();
        
        processedUrls.push(uploadResult.Location);
      } catch (error) {
        logger.error('Error processing image URL:', error);
      }
    }
    
    return processedUrls;
  }
}

// ReCraft API implementation
export class ReCraftImageService extends ImageGenerationService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.RECRAFT_API_KEY || '';
    this.baseUrl = 'https://api.recraft.ai/v1/generate';
  }

  async generateImage(options: ImageGenerationOptions): Promise<string[]> {
    try {
      logger.info(`Generating image with ReCraft API for prompt: ${options.prompt}`);
      
      const response = await axios.post(
        this.baseUrl,
        {
          prompt: options.prompt,
          style: options.style || 'realistic',
          width: options.width || 1024,
          height: options.height || 768,
          count: options.numberOfImages || 1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.results) {
        return await this.processImageUrls(response.data.results.map((result: any) => result.url));
      }
      
      throw new Error('No images returned from ReCraft API');
    } catch (error: any) {
      logger.error('Error generating image with ReCraft:', error);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  private async processImageUrls(imageUrls: string[]): Promise<string[]> {
    const processedUrls: string[] = [];
    
    for (const url of imageUrls) {
      try {
        // Download the image
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        
        // Generate a unique filename
        const filename = `${uuidv4()}.jpg`;
        
        // Upload to S3
        const uploadResult = await s3.upload({
          Bucket: process.env.AWS_BUCKET_NAME || 'textbuilder-images',
          Key: filename,
          Body: buffer,
          ContentType: 'image/jpeg',
          ACL: 'public-read'
        }).promise();
        
        processedUrls.push(uploadResult.Location);
      } catch (error) {
        logger.error('Error processing image URL:', error);
      }
    }
    
    return processedUrls;
  }
}

// Factory for creating image services
export class ImageServiceFactory {
  static getService(type: string = 'flux'): ImageGenerationService {
    switch (type.toLowerCase()) {
      case 'flux':
        return new FluxImageService();
      case 'recraft':
        return new ReCraftImageService();
      default:
        return new FluxImageService();
    }
  }
}

// Main image generation controller
export class ImageGenerator {
  static async generateImage(options: ImageGenerationOptions, serviceType: string = 'flux'): Promise<string[]> {
    try {
      const service = ImageServiceFactory.getService(serviceType);
      return await service.generateImage(options);
    } catch (error) {
      logger.error('Error in image generation:', error);
      throw error;
    }
  }
}

export default ImageGenerator;
