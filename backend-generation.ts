// backend/src/controllers/generation.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Queue } from 'bullmq';
import { asyncHandler, createError } from '../middleware/error';
import User from '../models/User';
import Article, { ArticleStatus } from '../models/Article';
import GenerationJob, { JobStatus } from '../models/GenerationJob';
import CreditTransaction, { TransactionType, Feature } from '../models/CreditTransaction';
import { createLogger } from '../utils/logger';
import { getRedisConnection } from '../utils/redis';

const logger = createLogger('generation-controller');

// Create BullMQ queue
const articleQueue = new Queue('article-generation', {
  connection: getRedisConnection()
});

/**
 * Generate title ideas based on a topic
 * @route POST /api/generate/titles
 * @access Private
 */
export const generateTitleIdeas = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { topic, niche, count = 20 } = req.body;

  if (!topic && !niche) {
    return next(createError('Please provide a topic or niche', 400));
  }

  // Get user for credits check
  const user = await User.findById(req.user!.id);

  // Check if user has enough credits (estimating 50 credits per request)
  if (user!.credits < 50) {
    return next(createError('Not enough credits', 400));
  }

  try {
    // In a real implementation, this would call the AI service
    // For now, we'll generate sample titles
    const aiService = require('../services/ai/factory').getAIService('gpt4');
    const titleIdeas = await aiService.generateTitleIdeas(topic || niche, count);

    // Deduct credits
    const creditsUsed = 50; // Fixed cost for title generation
    await User.findByIdAndUpdate(req.user!.id, {
      $inc: { credits: -creditsUsed }
    });

    // Log credit transaction
    await CreditTransaction.create({
      user: req.user!.id,
      amount: -creditsUsed,
      type: TransactionType.USAGE,
      feature: Feature.AUTO_WRITER,
      description: 'Title ideas generation'
    });

    res.status(200).json({
      success: true,
      data: {
        titles: titleIdeas,
        creditsUsed
      }
    });
  } catch (error) {
    logger.error('Error generating title ideas:', error);
    return next(createError('Error generating title ideas', 500));
  }
});

/**
 * Start bulk article generation
 * @route POST /api/generate/bulk
 * @access Private
 */
export const startBulkGeneration = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { titles, config } = req.body;

  // Validate input
  if (!titles || !Array.isArray(titles) || titles.length === 0) {
    return next(createError('Please provide an array of titles', 400));
  }

  if (!config) {
    return next(createError('Please provide configuration options', 400));
  }

  // Get user for credits check
  const user = await User.findById(req.user!.id);

  // Estimate credits needed
  const estimatedCreditsPerArticle = estimateCredits(config);
  const estimatedTotalCredits = estimatedCreditsPerArticle * titles.length;

  // Check if user has enough credits
  if (user!.credits < estimatedTotalCredits) {
    return next(createError(`Not enough credits. Need ${estimatedTotalCredits}, have ${user!.credits}`, 400));
  }

  // Generate a unique job ID
  const jobId = uuidv4();

  // Create job record
  const job = await GenerationJob.create({
    user: req.user!.id,
    jobId,
    status: JobStatus.QUEUED,
    type: 'bulk',
    progress: 0,
    titles,
    completedTitles: [],
    config,
    estimatedCredits: estimatedTotalCredits,
    actualCredits: 0
  });

  // Reserve credits
  await User.findByIdAndUpdate(req.user!.id, {
    $inc: { reservedCredits: estimatedTotalCredits }
  });

  // Add job to queue
  await articleQueue.add('bulk-generation', {
    jobId,
    userId: req.user!.id,
    titles,
    config
  });

  res.status(202).json({
    success: true,
    data: {
      jobId,
      estimatedCredits: estimatedTotalCredits,
      estimatedTimeMinutes: Math.ceil(titles.length * 3) // Rough estimate: 3 minutes per article
    }
  });
});

/**
 * Generate a single article
 * @route POST /api/generate/article
 * @access Private
 */
export const generateSingleArticle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { title, config } = req.body;

  // Validate input
  if (!title) {
    return next(createError('Please provide a title', 400));
  }

  if (!config) {
    return next(createError('Please provide configuration options', 400));
  }

  // Get user for credits check
  const user = await User.findById(req.user!.id);

  // Estimate credits needed
  const estimatedCredits = estimateCredits(config);

  // Check if user has enough credits
  if (user!.credits < estimatedCredits) {
    return next(createError(`Not enough credits. Need ${estimatedCredits}, have ${user!.credits}`, 400));
  }

  // Generate a unique job ID
  const jobId = uuidv4();

  // Create job record
  const job = await GenerationJob.create({
    user: req.user!.id,
    jobId,
    status: JobStatus.QUEUED,
    type: 'single',
    progress: 0,
    titles: [title],
    completedTitles: [],
    config,
    estimatedCredits,
    actualCredits: 0
  });

  // Reserve credits
  await User.findByIdAndUpdate(req.user!.id, {
    $inc: { reservedCredits: estimatedCredits }
  });

  // Add job to queue
  await articleQueue.add('single-generation', {
    jobId,
    userId: req.user!.id,
    title,
    config
  });

  res.status(202).json({
    success: true,
    data: {
      jobId,
      estimatedCredits,
      estimatedTimeMinutes: 3 // Rough estimate: 3 minutes per article
    }
  });
});

/**
 * Get job status
 * @route GET /api/generate/status/:jobId
 * @access Private
 */
export const getJobStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;

  // Find job
  const job = await GenerationJob.findOne({
    jobId,
    user: req.user!.id
  });

  if (!job) {
    return next(createError('Job not found', 404));
  }

  // Get articles if job is completed
  let articles = [];
  if (job.status === JobStatus.COMPLETED) {
    articles = await Article.find({ jobId });
  }

  res.status(200).json({
    success: true,
    data: {
      job,
      articles: job.status === JobStatus.COMPLETED ? articles : []
    }
  });
});

/**
 * Get all user jobs
 * @route GET /api/generate/jobs
 * @access Private
 */
export const getUserJobs = asyncHandler(async (req: Request, res: Response) => {
  // Set up pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Get jobs count
  const total = await GenerationJob.countDocuments({ user: req.user!.id });

  // Get jobs with pagination
  const jobs = await GenerationJob.find({ user: req.user!.id })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    hasNext: endIndex < total,
    hasPrev: startIndex > 0
  };

  res.status(200).json({
    success: true,
    pagination,
    data: jobs
  });
});

/**
 * Cancel a job
 * @route DELETE /api/generate/jobs/:jobId
 * @access Private
 */
export const cancelJob = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;

  // Find job
  const job = await GenerationJob.findOne({
    jobId,
    user: req.user!.id
  });

  if (!job) {
    return next(createError('Job not found', 404));
  }

  // Check if job can be cancelled
  if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
    return next(createError(`Job cannot be cancelled in ${job.status} state`, 400));
  }

  // Update job status
  job.status = JobStatus.CANCELLED;
  await job.save();

  // Return reserved credits
  await User.findByIdAndUpdate(req.user!.id, {
    $inc: { reservedCredits: -job.estimatedCredits }
  });

  // Log credit transaction
  await CreditTransaction.create({
    user: req.user!.id,
    amount: job.estimatedCredits,
    type: TransactionType.ADJUSTMENT,
    feature: job.type === 'bulk' ? Feature.AUTO_WRITER : Feature.AI_WRITER,
    description: 'Job cancellation credit refund',
    metadata: { jobId }
  });

  // Remove job from queue (not implemented in this example)
  // In a real implementation, this would use BullMQ's removeJobs method

  res.status(200).json({
    success: true,
    data: {
      message: 'Job cancelled successfully',
      creditsReturned: job.estimatedCredits
    }
  });
});

/**
 * Estimate credits for an article based on configuration
 * @param config Article configuration
 * @returns Estimated credits needed
 */
const estimateCredits = (config: any): number => {
  let baseCredits = 0;

  // Base credits by length
  switch (config.length) {
    case 'short':
      baseCredits = 800;
      break;
    case 'medium':
      baseCredits = 1500;
      break;
    case 'long':
      baseCredits = 2500;
      break;
    default:
      baseCredits = 1500;
  }

  // Add credits for additional features
  if (config.generateImages) {
    baseCredits += config.imageCount * 50; // 50 credits per image
  }

  if (config.takeaways) {
    baseCredits += config.takeaways * 10; // 10 credits per takeaway
  }

  if (config.faqItems) {
    baseCredits += config.faqItems * 20; // 20 credits per FAQ item
  }

  // Add a buffer for other processing
  const buffer = baseCredits * 0.1;

  return Math.ceil(baseCredits + buffer);
};

// backend/src/routes/generation.ts
import express from 'express';
import { 
  generateTitleIdeas,
  startBulkGeneration,
  generateSingleArticle,
  getJobStatus,
  getUserJobs,
  cancelJob
} from '../controllers/generation';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Generation routes
router.post('/titles', generateTitleIdeas);
router.post('/bulk', startBulkGeneration);
router.post('/article', generateSingleArticle);
router.get('/status/:jobId', getJobStatus);
router.get('/jobs', getUserJobs);
router.delete('/jobs/:jobId', cancelJob);

export default router;
