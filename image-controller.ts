// backend/src/controllers/images.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler, createError } from '../middleware/error';
import ImageGenerator, { ImageGenerationOptions } from '../services/images/generator';
import User from '../models/User';
import CreditTransaction, { TransactionType, Feature } from '../models/CreditTransaction';
import { createLogger } from '../utils/logger';

const logger = createLogger('images-controller');

/**
 * Generate an image based on a prompt
 * @route POST /api/images/generate
 * @access Private
 */
export const generateImage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { prompt, style, width, height, numberOfImages = 1, serviceType = 'flux' } = req.body;
  
  if (!prompt) {
    return next(createError('Please provide a prompt for image generation', 400));
  }
  
  // Get user for credits check
  const user = await User.findById(req.user!.id);
  
  // Calculate credits needed (50 credits per image)
  const creditsNeeded = numberOfImages * 50;
  
  // Check if user has enough credits
  if (user!.credits < creditsNeeded) {
    return next(createError(`Not enough credits. Need ${creditsNeeded}, have ${user!.credits}`, 400));
  }
  
  try {
    // Generate images
    const options: ImageGenerationOptions = {
      prompt,
      style,
      width,
      height,
      numberOfImages
    };
    
    const imageUrls = await ImageGenerator.generateImage(options, serviceType);
    
    // Deduct credits
    await User.findByIdAndUpdate(req.user!.id, {
      $inc: { credits: -creditsNeeded }
    });
    
    // Log credit transaction
    await CreditTransaction.create({
      user: req.user!.id,
      amount: -creditsNeeded,
      type: TransactionType.USAGE,
      feature: Feature.IMAGE_GENERATION,
      description: `Generated ${numberOfImages} image(s)`
    });
    
    res.status(200).json({
      success: true,
      data: {
        images: imageUrls,
        creditsUsed: creditsNeeded
      }
    });
  } catch (error) {
    logger.error('Error generating images:', error);
    return next(createError('Error generating images', 500));
  }
});

/**
 * Get estimated credits for image generation
 * @route GET /api/images/estimate
 * @access Private
 */
export const getEstimatedCredits = asyncHandler(async (req: Request, res: Response) => {
  const { numberOfImages = 1 } = req.query;
  
  // Calculate credits (50 per image)
  const estimatedCredits = parseInt(numberOfImages as string) * 50;
  
  res.status(200).json({
    success: true,
    data: {
      estimatedCredits
    }
  });
});
