// backend/src/workers/articleGenerator.ts
import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import { getRedisConnection } from '../utils/redis';
import { getAIService, AIServiceType } from '../services/ai/factory';
import User from '../models/User';
import Article, { ArticleStatus, IArticleConfig } from '../models/Article';
import GenerationJob, { JobStatus } from '../models/GenerationJob';
import CreditTransaction, { TransactionType, Feature } from '../models/CreditTransaction';
import { createLogger } from '../utils/logger';

const logger = createLogger('article-worker');

// Connect to MongoDB if not already connected
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/textbuilder';
      await mongoose.connect(mongoURI);
      logger.info('Worker connected to MongoDB');
    }
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start the worker
const startWorker = async () => {
  await connectDB();

  // Create a worker for processing article generation jobs
  const worker = new Worker(
    'article-generation',
    async (job: Job) => {
      logger.info(`Processing job ${job.id} of type ${job.name}`);

      try {
        if (job.name === 'bulk-generation') {
          return await processBulkGeneration(job);
        } else if (job.name === 'single-generation') {
          return await processSingleGeneration(job);
        } else {
          throw new Error(`Unknown job type: ${job.name}`);
        }
      } catch (error) {
        logger.error(`Error processing job ${job.id}:`, error);
        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5')
    }
  );

  // Handle worker events
  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Job ${job?.id} failed:`, error);
  });

  logger.info('Article generation worker started');
  
  return worker;
};

/**
 * Process a bulk generation job
 * @param job The BullMQ job
 */
const processBulkGeneration = async (job: Job): Promise<any> => {
  const { jobId, userId, titles, config } = job.data;
  
  // Update job status to running
  await updateJobStatus(jobId, JobStatus.RUNNING, 0);
  
  // Get job from database
  const generationJob = await GenerationJob.findOne({ jobId });
  if (!generationJob) {
    throw new Error(`Job ${jobId} not found in database`);
  }
  
  // Process each title
  const totalTitles = titles.length;
  let completedTitles = 0;
  let totalCreditsUsed = 0;
  
  for (const title of titles) {
    try {
      // Update job progress
      await updateJobStatus(
        jobId, 
        JobStatus.RUNNING,
        Math.floor((completedTitles / totalTitles) * 100),
        `Generating article ${completedTitles + 1} of ${totalTitles}: ${title}`
      );
      
      // Generate article
      const { article, creditsUsed } = await generateArticle(userId, title, config, jobId);
      
      // Track credits used
      totalCreditsUsed += creditsUsed;
      
      // Update job progress
      completedTitles++;
      await GenerationJob.findOneAndUpdate(
        { jobId },
        { 
          $push: { completedTitles: title },
          $set: { 
            progress: Math.floor((completedTitles / totalTitles) * 100),
            actualCredits: totalCreditsUsed
          }
        }
      );
      
      // Log progress
      logger.info(`Generated article "${title}" (${completedTitles}/${totalTitles})`);
      
      // Wait a short time to avoid overwhelming the AI API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error(`Error generating article "${title}":`, error);
      // Continue with next title
    }
  }
  
  // Complete the job
  await finalizeJob(jobId, userId, totalCreditsUsed);
  
  return {
    success: true,
    completedTitles,
    totalCreditsUsed
  };
};

/**
 * Process a single article generation job
 * @param job The BullMQ job
 */
const processSingleGeneration = async (job: Job): Promise<any> => {
  const { jobId, userId, title, config } = job.data;
  
  // Update job status to running
  await updateJobStatus(jobId, JobStatus.RUNNING, 0);
  
  try {
    // Generate article
    const { article, creditsUsed } = await generateArticle(userId, title, config, jobId);
    
    // Complete the job
    await finalizeJob(jobId, userId, creditsUsed);
    
    return {
      success: true,
      articleId: article._id,
      creditsUsed
    };
  } catch (error) {
    logger.error(`Error generating article "${title}":`, error);
    
    // Mark job as failed
    await updateJobStatus(jobId, JobStatus.FAILED, 0, (error as Error).message);
    
    // Return reserved credits to user
    const job = await GenerationJob.findOne({ jobId });
    if (job) {
      await User.findByIdAndUpdate(userId, {
        $inc: { reservedCredits: -job.estimatedCredits }
      });
    }
    
    throw error;
  }
};

/**
 * Generate a single article
 * @param userId User ID
 * @param title Article title
 * @param config Article configuration
 * @param jobId Job ID
 */
const generateArticle = async (
  userId: string,
  title: string,
  config: IArticleConfig,
  jobId: string
): Promise<{ article: any, creditsUsed: number }> => {
  try {
    // Select AI service based on config
    const aiType = config.aiModel || AIServiceType.GPT4;
    const aiService = getAIService(aiType);
    
    // Generate outline
    const outline = await aiService.generateOutline(title, config);
    
    // Generate content for each section of the outline
    const contentSections = await aiService.expandOutline(title, outline, config);
    
    // Combine all sections into a complete article
    let fullContent = '';
    
    // Add key takeaways if configured
    if (config.takeaways && config.takeaways > 0) {
      fullContent += `## Key Takeaways\n\n`;
      
      // In a real implementation, we'd generate specific takeaways
      // For now, we'll use placeholder takeaways
      for (let i = 0; i < config.takeaways; i++) {
        fullContent += `- Key point ${i + 1} about ${title}\n`;
      }
      
      fullContent += `\n\n`;
    }
    
    // Add each section content
    for (const section of outline) {
      fullContent += `## ${section}\n\n${contentSections[section]}\n\n`;
    }
    
    // Add FAQs if configured
    if (config.faqItems && config.faqItems > 0) {
      fullContent += `## Frequently Asked Questions\n\n`;
      
      const faqs = await aiService.generateFAQs(title, fullContent, config.faqItems);
      
      for (const faq of faqs) {
        fullContent += `### ${faq.question}\n\n${faq.answer}\n\n`;
      }
    }
    
    // Generate images if configured
    let images = [];
    if (config.generateImages && config.imageCount > 0) {
      // In a real implementation, this would call the image generation service
      // For now, we'll use placeholder images
      
      // Featured image
      images.push({
        url: `https://example.com/placeholder-image-${Date.now()}.jpg`,
        alt: `Featured image for ${title}`,
        position: 'featured',
        caption: `Image related to ${title}`
      });
      
      // Additional images
      for (let i = 1; i < config.imageCount; i++) {
        const positions = ['beginning', 'middle', 'end'];
        images.push({
          url: `https://example.com/placeholder-image-${Date.now() + i}.jpg`,
          alt: `Additional image ${i} for ${title}`,
          position: positions[i % positions.length],
          caption: `Additional image related to ${title}`
        });
      }
    }
    
    // Calculate word count
    const wordCount = fullContent.split(/\s+/).length;
    
    // Create article in database
    const article = await Article.create({
      user: userId,
      jobId,
      title,
      content: fullContent,
      status: ArticleStatus.COMPLETED,
      wordCount,
      images,
      config
    });
    
    // Calculate credits used (word count + image credits)
    const creditsUsed = wordCount + (images.length * 50);
    
    return { article, creditsUsed };
  } catch (error) {
    logger.error(`Error in generateArticle for "${title}":`, error);
    throw error;
  }
};

/**
 * Update job status
 * @param jobId Job ID
 * @param status Job status
 * @param progress Job progress (0-100)
 * @param message Optional status message
 */
const updateJobStatus = async (
  jobId: string,
  status: JobStatus,
  progress: number,
  message?: string
): Promise<void> => {
  const updateFields: any = {
    status,
    progress
  };
  
  if (message) {
    updateFields.errorMessage = message;
  }
  
  if (status === JobStatus.RUNNING && progress === 0) {
    updateFields.startedAt = new Date();
  } else if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
    updateFields.completedAt = new Date();
  }
  
  await GenerationJob.findOneAndUpdate(
    { jobId },
    updateFields
  );
};

/**
 * Finalize a job (mark as completed and update credits)
 * @param jobId Job ID
 * @param userId User ID
 * @param creditsUsed Credits used for the job
 */
const finalizeJob = async (
  jobId: string,
  userId: string,
  creditsUsed: number
): Promise<void> => {
  // Get job from database
  const job = await GenerationJob.findOne({ jobId });
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  // Mark job as completed
  await updateJobStatus(jobId, JobStatus.COMPLETED, 100);
  
  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  
  // Update credits (remove reserved credits and deduct actual used credits)
  await User.findByIdAndUpdate(userId, {
    $inc: {
      credits: -creditsUsed,
      reservedCredits: -job.estimatedCredits
    }
  });
  
  // Create credit transaction
  await CreditTransaction.create({
    user: userId,
    amount: -creditsUsed,
    type: TransactionType.USAGE,
    feature: job.type === 'bulk' ? Feature.AUTO_WRITER : Feature.AI_WRITER,
    description: `Article generation (${job.type})`,
    metadata: { jobId }
  });
  
  // If there's a difference between estimated and actual, create adjustment transaction
  if (job.estimatedCredits > creditsUsed) {
    const difference = job.estimatedCredits - creditsUsed;
    
    await CreditTransaction.create({
      user: userId,
      amount: difference,
      type: TransactionType.ADJUSTMENT,
      feature: job.type === 'bulk' ? Feature.AUTO_WRITER : Feature.AI_WRITER,
      description: 'Credit adjustment for unused estimated credits',
      metadata: { jobId }
    });
    
    // Add the difference back to the user's credits
    await User.findByIdAndUpdate(userId, {
      $inc: { credits: difference }
    });
  }
};

// If this file is run directly, start the worker
if (require.main === module) {
  startWorker().catch(error => {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  });
}

export { startWorker };
