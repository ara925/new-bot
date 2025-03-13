// backend/src/controllers/articles.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler, createError } from '../middleware/error';
import Article, { ArticleStatus } from '../models/Article';
import { createLogger } from '../utils/logger';

const logger = createLogger('articles-controller');

/**
 * Get all articles
 * @route GET /api/articles
 * @access Private
 */
export const getArticles = asyncHandler(async (req: Request, res: Response) => {
  // Set up pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Set up filters
  const filters: any = { user: req.user!.id };
  
  // Status filter
  if (req.query.status) {
    filters.status = req.query.status;
  }
  
  // Search filter
  if (req.query.search) {
    filters.$text = { $search: req.query.search };
  }
  
  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    filters.createdAt = {
      $gte: new Date(req.query.startDate as string),
      $lte: new Date(req.query.endDate as string)
    };
  }

  // Get articles count
  const total = await Article.countDocuments(filters);

  // Get articles with pagination
  const articles = await Article.find(filters)
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
    data: articles
  });
});

/**
 * Get single article
 * @route GET /api/articles/:id
 * @access Private
 */
export const getArticle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const article = await Article.findOne({
    _id: req.params.id,
    user: req.user!.id
  });

  if (!article) {
    return next(createError('Article not found', 404));
  }

  res.status(200).json({
    success: true,
    data: article
  });
});

/**
 * Update article
 * @route PUT /api/articles/:id
 * @access Private
 */
export const updateArticle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Find article to update
  let article = await Article.findOne({
    _id: req.params.id,
    user: req.user!.id
  });

  if (!article) {
    return next(createError('Article not found', 404));
  }

  // Update fields
  const fieldsToUpdate = req.body;
  
  // Calculate word count if content is changed
  if (fieldsToUpdate.content) {
    fieldsToUpdate.wordCount = fieldsToUpdate.content.split(/\s+/).length;
  }

  // Update article
  article = await Article.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: article
  });
});

/**
 * Delete article
 * @route DELETE /api/articles/:id
 * @access Private
 */
export const deleteArticle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Find article to delete
  const article = await Article.findOne({
    _id: req.params.id,
    user: req.user!.id
  });

  if (!article) {
    return next(createError('Article not found', 404));
  }

  // Delete article
  await article.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * Delete multiple articles
 * @route DELETE /api/articles
 * @access Private
 */
export const deleteMultipleArticles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(createError('Please provide an array of article IDs', 400));
  }

  // Delete articles
  const result = await Article.deleteMany({
    _id: { $in: ids },
    user: req.user!.id
  });

  res.status(200).json({
    success: true,
    data: {
      deletedCount: result.deletedCount
    }
  });
});

/**
 * Publish article to WordPress
 * @route POST /api/articles/:id/publish
 * @access Private
 */
export const publishArticle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { wordpressSiteId, schedule } = req.body;

  // Find article
  const article = await Article.findOne({
    _id: req.params.id,
    user: req.user!.id
  });

  if (!article) {
    return next(createError('Article not found', 404));
  }

  try {
    // Import WordPress service
    const wordpressService = require('../services/wordpress/api');
    
    // Publish to WordPress
    const publishResult = await wordpressService.publishArticle(
      req.user!.id,
      article,
      wordpressSiteId,
      schedule
    );

    // Update article status
    article.status = ArticleStatus.PUBLISHED;
    article.publishedUrl = publishResult.url;
    article.publishedAt = new Date();
    await article.save();

    res.status(200).json({
      success: true,
      data: {
        article,
        publishResult
      }
    });
  } catch (error) {
    logger.error('Error publishing to WordPress:', error);
    return next(createError('Failed to publish to WordPress', 500));
  }
});

/**
 * Export article as HTML/Markdown
 * @route GET /api/articles/:id/export
 * @access Private
 */
export const exportArticle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { format = 'html' } = req.query;

  // Find article
  const article = await Article.findOne({
    _id: req.params.id,
    user: req.user!.id
  });

  if (!article) {
    return next(createError('Article not found', 404));
  }

  // Format the content based on the requested format
  let formattedContent = '';
  let contentType = '';
  let filename = '';

  if (format === 'markdown' || format === 'md') {
    // For markdown, we might need to convert from HTML if article is stored as HTML
    formattedContent = article.content; // Assuming content is already in markdown
    contentType = 'text/markdown';
    filename = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
  } else {
    // Default to HTML
    formattedContent = article.content; // Assuming content is already in HTML or markdown
    contentType = 'text/html';
    filename = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
  }

  // Set response headers
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Send the formatted content
  res.send(formattedContent);
});

// backend/src/routes/articles.ts
import express from 'express';
import { 
  getArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  deleteMultipleArticles,
  publishArticle,
  exportArticle
} from '../controllers/articles';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Article routes
router.get('/', getArticles);
router.get('/:id', getArticle);
router.put('/:id', updateArticle);
router.delete('/:id', deleteArticle);
router.delete('/', deleteMultipleArticles);
router.post('/:id/publish', publishArticle);
router.get('/:id/export', exportArticle);

export default router;
