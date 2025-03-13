// backend/src/services/wordpress/api.ts
import axios from 'axios';
import bcrypt from 'bcryptjs';
import User, { IWordPressSite } from '../../models/User';
import Article from '../../models/Article';
import { createLogger } from '../../utils/logger';

const logger = createLogger('wordpress-service');

// Default timeout for WordPress API requests
const DEFAULT_TIMEOUT = parseInt(process.env.WP_API_DEFAULT_TIMEOUT || '30000');

/**
 * WordPress API Service
 */
export class WordPressService {
  /**
   * Get WordPress site by ID
   */
  public async getSite(userId: string, siteId: string): Promise<IWordPressSite | null> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const site = user.wordpressSites.find(site => site._id.toString() === siteId);
      
      return site || null;
    } catch (error) {
      logger.error('Error getting WordPress site:', error);
      throw error;
    }
  }
  
  /**
   * Get all WordPress sites for a user
   */
  public async getSites(userId: string): Promise<IWordPressSite[]> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user.wordpressSites;
    } catch (error) {
      logger.error('Error getting WordPress sites:', error);
      throw error;
    }
  }
  
  /**
   * Add a new WordPress site
   */
  public async addSite(userId: string, siteData: IWordPressSite): Promise<IWordPressSite> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Validate the site connection before adding
      await this.validateSiteConnection(siteData);
      
      // Add the site to the user's sites
      user.wordpressSites.push(siteData);
      await user.save();
      
      return siteData;
    } catch (error) {
      logger.error('Error adding WordPress site:', error);
      throw error;
    }
  }
  
  /**
   * Update a WordPress site
   */
  public async updateSite(userId: string, siteId: string, siteData: Partial<IWordPressSite>): Promise<IWordPressSite | null> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Find the site to update
      const siteIndex = user.wordpressSites.findIndex(site => site._id.toString() === siteId);
      
      if (siteIndex === -1) {
        throw new Error('WordPress site not found');
      }
      
      // Update the site
      const updatedSite = {
        ...user.wordpressSites[siteIndex].toObject(),
        ...siteData
      };
      
      // If URL, username, or password changed, validate the connection
      if (siteData.url || siteData.username || siteData.password) {
        await this.validateSiteConnection(updatedSite);
      }
      
      // Update the site in the user's sites
      user.wordpressSites[siteIndex] = updatedSite;
      await user.save();
      
      return user.wordpressSites[siteIndex];
    } catch (error) {
      logger.error('Error updating WordPress site:', error);
      throw error;
    }
  }
  
  /**
   * Delete a WordPress site
   */
  public async deleteSite(userId: string, siteId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Find the site to delete
      const siteIndex = user.wordpressSites.findIndex(site => site._id.toString() === siteId);
      
      if (siteIndex === -1) {
        throw new Error('WordPress site not found');
      }
      
      // Remove the site from the user's sites
      user.wordpressSites.splice(siteIndex, 1);
      await user.save();
      
      return true;
    } catch (error) {
      logger.error('Error deleting WordPress site:', error);
      throw error;
    }
  }
  
  /**
   * Validate WordPress site connection
   */
  public async validateSiteConnection(site: IWordPressSite): Promise<boolean> {
    try {
      // Create WordPress REST API client
      const client = this.createClient(site);
      
      // Try to get site info
      const response = await client.get('/');
      
      // Check if the response is valid
      if (!response.data || !response.data.name) {
        throw new Error('Invalid WordPress site response');
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating WordPress site connection:', error);
      throw new Error('Failed to connect to WordPress site: ' + (error as Error).message);
    }
  }
  
  /**
   * Publish an article to WordPress
   */
  public async publishArticle(
    userId: string,
    article: any,
    siteId: string,
    scheduleDate?: Date
  ): Promise<{ id: number, url: string }> {
    try {
      // Get the WordPress site
      const site = await this.getSite(userId, siteId);
      
      if (!site) {
        throw new Error('WordPress site not found');
      }
      
      // Create WordPress REST API client
      const client = this.createClient(site);
      
      // Prepare post data
      const postData = await this.preparePostData(article, site, client);
      
      // Set status and date
      if (scheduleDate && scheduleDate > new Date()) {
        postData.status = 'future';
        postData.date = scheduleDate.toISOString();
      } else {
        postData.status = 'publish';
      }
      
      // Create the post
      const response = await client.post('/wp/v2/posts', postData);
      
      // Return post ID and URL
      return {
        id: response.data.id,
        url: response.data.link
      };
    } catch (error) {
      logger.error('Error publishing article to WordPress:', error);
      throw new Error('Failed to publish article to WordPress: ' + (error as Error).message);
    }
  }
  
  /**
   * Get WordPress categories
   */
  public async getCategories(userId: string, siteId: string): Promise<any[]> {
    try {
      // Get the WordPress site
      const site = await this.getSite(userId, siteId);
      
      if (!site) {
        throw new Error('WordPress site not found');
      }
      
      // Create WordPress REST API client
      const client = this.createClient(site);
      
      // Get categories
      const response = await client.get('/wp/v2/categories', {
        params: {
          per_page: 100
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error getting WordPress categories:', error);
      throw new Error('Failed to get WordPress categories: ' + (error as Error).message);
    }
  }
  
  /**
   * Get WordPress tags
   */
  public async getTags(userId: string, siteId: string, search?: string): Promise<any[]> {
    try {
      // Get the WordPress site
      const site = await this.getSite(userId, siteId);
      
      if (!site) {
        throw new Error('WordPress site not found');
      }
      
      // Create WordPress REST API client
      const client = this.createClient(site);
      
      // Prepare params
      const params: any = {
        per_page: 100
      };
      
      if (search) {
        params.search = search;
      }
      
      // Get tags
      const response = await client.get('/wp/v2/tags', { params });
      
      return response.data;
    } catch (error) {
      logger.error('Error getting WordPress tags:', error);
      throw new Error('Failed to get WordPress tags: ' + (error as Error).message);
    }
  }
  
  /**
   * Create WordPress REST API client
   */
  private createClient(site: IWordPressSite) {
    const { url, username, password } = site;
    
    // Create basic auth token
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    
    // Create Axios instance
    return axios.create({
      baseURL: url.endsWith('/') ? `${url}wp-json` : `${url}/wp-json`,
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: DEFAULT_TIMEOUT
    });
  }
  
  /**
   * Prepare post data for WordPress
   */
  private async preparePostData(article: any, site: IWordPressSite, client: any): Promise<any> {
    // Basic post data
    const postData: any = {
      title: article.title,
      content: this.formatContentForWordPress(article.content),
      status: 'draft' // Default to draft, will be updated later
    };
    
    // Set SEO title and description if available
    if (article.seoTitle) {
      postData.meta = {
        ...postData.meta,
        _yoast_wpseo_title: article.seoTitle
      };
    }
    
    if (article.seoDescription) {
      postData.meta = {
        ...postData.meta,
        _yoast_wpseo_metadesc: article.seoDescription
      };
    }
    
    // Add featured image if available
    if (article.images && article.images.length > 0) {
      const featuredImage = article.images.find((img: any) => img.position === 'featured');
      
      if (featuredImage) {
        // In a real implementation, this would download the image and upload it to WordPress
        // For now, we'll skip this step
      }
    }
    
    // Add tags
    if (article.title) {
      // Extract potential tags from title
      const words = article.title.split(/\s+/).filter((word: string) => word.length > 3);
      
      // Get or create tags
      const tags: number[] = [];
      
      for (const word of words.slice(0, 5)) { // Limit to 5 tags
        try {
          // Search for existing tag
          const searchResponse = await client.get('/wp/v2/tags', {
            params: {
              search: word,
              per_page: 1
            }
          });
          
          if (searchResponse.data.length > 0) {
            tags.push(searchResponse.data[0].id);
          } else {
            // Create new tag
            const createResponse = await client.post('/wp/v2/tags', {
              name: word
            });
            
            tags.push(createResponse.data.id);
          }
        } catch (error) {
          logger.warn(`Error processing tag "${word}":`, error);
          // Continue with next tag
        }
      }
      
      if (tags.length > 0) {
        postData.tags = tags;
      }
    }
    
    // Add to default category if no category specified
    postData.categories = [1]; // Default category (Uncategorized)
    
    return postData;
  }
  
  /**
   * Format content for WordPress
   * Converts markdown to HTML if needed and handles image formatting
   */
  private formatContentForWordPress(content: string): string {
    // In a real implementation, this would convert markdown to HTML if needed
    // and process images and other media
    // For now, we'll return the content as is
    return content;
  }
}

// Create and export service instance
export const wordpressService = new WordPressService();

// Export as module for compatibility with require() in other files
module.exports = wordpressService;

// backend/src/controllers/wordpress.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler, createError } from '../middleware/error';
import { wordpressService } from '../services/wordpress/api';
import { createLogger } from '../utils/logger';

const logger = createLogger('wordpress-controller');

/**
 * Get all WordPress sites for a user
 * @route GET /api/wordpress/sites
 * @access Private
 */
export const getSites = asyncHandler(async (req: Request, res: Response) => {
  const sites = await wordpressService.getSites(req.user!.id);
  
  res.status(200).json({
    success: true,
    data: sites
  });
});

/**
 * Get a single WordPress site
 * @route GET /api/wordpress/sites/:id
 * @access Private
 */
export const getSite = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const site = await wordpressService.getSite(req.user!.id, req.params.id);
  
  if (!site) {
    return next(createError('WordPress site not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: site
  });
});

/**
 * Add a new WordPress site
 * @route POST /api/wordpress/sites
 * @access Private
 */
export const addSite = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, url, username, password } = req.body;
  
  // Validate required fields
  if (!name || !url || !username || !password) {
    return next(createError('Please provide name, URL, username and password', 400));
  }
  
  // Add the site
  const site = await wordpressService.addSite(req.user!.id, {
    name,
    url,
    username,
    password
  });
  
  res.status(201).json({
    success: true,
    data: site
  });
});

/**
 * Update a WordPress site
 * @route PUT /api/wordpress/sites/:id
 * @access Private
 */
export const updateSite = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, url, username, password } = req.body;
  
  // Update the site
  const site = await wordpressService.updateSite(req.user!.id, req.params.id, {
    name,
    url,
    username,
    password
  });
  
  if (!site) {
    return next(createError('WordPress site not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: site
  });
});

/**
 * Delete a WordPress site
 * @route DELETE /api/wordpress/sites/:id
 * @access Private
 */
export const deleteSite = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const result = await wordpressService.deleteSite(req.user!.id, req.params.id);
  
  if (!result) {
    return next(createError('WordPress site not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * Validate a WordPress site connection
 * @route POST /api/wordpress/validate
 * @access Private
 */
export const validateSite = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { url, username, password } = req.body;
  
  // Validate required fields
  if (!url || !username || !password) {
    return next(createError('Please provide URL, username and password', 400));
  }
  
  // Validate the site connection
  const result = await wordpressService.validateSiteConnection({
    name: 'Validation Test',
    url,
    username,
    password
  });
  
  res.status(200).json({
    success: true,
    data: {
      valid: result
    }
  });
});

/**
 * Get WordPress categories
 * @route GET /api/wordpress/sites/:id/categories
 * @access Private
 */
export const getCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check if site exists
  const site = await wordpressService.getSite(req.user!.id, req.params.id);
  
  if (!site) {
    return next(createError('WordPress site not found', 404));
  }
  
  // Get categories
  const categories = await wordpressService.getCategories(req.user!.id, req.params.id);
  
  res.status(200).json({
    success: true,
    data: categories
  });
});

/**
 * Get WordPress tags
 * @route GET /api/wordpress/sites/:id/tags
 * @access Private
 */
export const getTags = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const search = req.query.search as string;
  
  // Check if site exists
  const site = await wordpressService.getSite(req.user!.id, req.params.id);
  
  if (!site) {
    return next(createError('WordPress site not found', 404));
  }
  
  // Get tags
  const tags = await wordpressService.getTags(req.user!.id, req.params.id, search);
  
  res.status(200).json({
    success: true,
    data: tags
  });
});

// backend/src/routes/wordpress.ts
import express from 'express';
import { 
  getSites,
  getSite,
  addSite,
  updateSite,
  deleteSite,
  validateSite,
  getCategories,
  getTags
} from '../controllers/wordpress';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// WordPress site routes
router.get('/sites', getSites);
router.get('/sites/:id', getSite);
router.post('/sites', addSite);
router.put('/sites/:id', updateSite);
router.delete('/sites/:id', deleteSite);

// WordPress validation route
router.post('/validate', validateSite);

// WordPress metadata routes
router.get('/sites/:id/categories', getCategories);
router.get('/sites/:id/tags', getTags);

export default router;
