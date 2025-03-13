// Backend services exports
// This file re-exports service modules for easier imports

// AI services
import { getAIService, AIServiceType, AIServiceFactory } from './ai/factory';
import { OpenAIService } from './ai/openai';
import { ClaudeService } from './ai/claude';

// WordPress services
import { wordpressService, WordPressService } from './wordpress/api';

// Image generation services
import ImageGenerator, { 
  ImageGenerationOptions, 
  FluxImageService, 
  ReCraftImageService, 
  ImageServiceFactory 
} from './images/generator';

// Export all services
export {
  // AI services
  getAIService,
  AIServiceType,
  AIServiceFactory,
  OpenAIService,
  ClaudeService,
  
  // WordPress services
  wordpressService,
  WordPressService,
  
  // Image generation services
  ImageGenerator,
  ImageGenerationOptions,
  FluxImageService,
  ReCraftImageService,
  ImageServiceFactory
};

// Factory function to get appropriate service
export const getService = (type: string, serviceType: string) => {
  switch (type) {
    case 'ai':
      return getAIService(serviceType);
    case 'image':
      return ImageServiceFactory.getService(serviceType);
    case 'wordpress':
      return wordpressService;
    default:
      throw new Error(`Unknown service type: ${type}`);
  }
};
