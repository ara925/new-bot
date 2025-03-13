// backend/src/controllers/settings.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, createError } from '../middleware/error';
import User from '../models/User';
import { createLogger } from '../utils/logger';

const logger = createLogger('settings-controller');

/**
 * Get user preferences
 * @route GET /api/settings/preferences
 * @access Private
 */
export const getUserPreferences = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  
  res.status(200).json({
    success: true,
    data: user!.preferences || {}
  });
});

/**
 * Update user preferences
 * @route PUT /api/settings/preferences
 * @access Private
 */
export const updateUserPreferences = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { preferences } = req.body;
  
  if (!preferences) {
    return next(createError('Preferences are required', 400));
  }
  
  // Update user preferences
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { preferences },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    data: user!.preferences
  });
});

/**
 * Get user API keys
 * @route GET /api/settings/api-keys
 * @access Private
 */
export const getUserApiKeys = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  
  res.status(200).json({
    success: true,
    data: user!.apiKeys || []
  });
});

/**
 * Generate new API key
 * @route POST /api/settings/api-keys
 * @access Private
 */
export const generateApiKey = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  
  if (!name) {
    return next(createError('API key name is required', 400));
  }
  
  // Generate API key
  const apiKey = `tb_${uuidv4().replace(/-/g, '')}`;
  const keyData = {
    name,
    key: apiKey,
    createdAt: new Date()
  };
  
  // Add API key to user
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { $push: { apiKeys: keyData } },
    { new: true }
  );
  
  res.status(201).json({
    success: true,
    data: keyData
  });
});

/**
 * Delete API key
 * @route DELETE /api/settings/api-keys/:id
 * @access Private
 */
export const deleteApiKey = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  if (!id) {
    return next(createError('API key ID is required', 400));
  }
  
  // Remove API key from user
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { $pull: { apiKeys: { key: id } } },
    { new: true }
  );
  
  if (!user) {
    return next(createError('User not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * Get user notification settings
 * @route GET /api/settings/notifications
 * @access Private
 */
export const getUserNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  
  res.status(200).json({
    success: true,
    data: user!.notificationSettings || {
      email: true,
      browser: true,
      articles: true,
      promotions: true,
      credits: true
    }
  });
});

/**
 * Update notification settings
 * @route PUT /api/settings/notifications
 * @access Private
 */
export const updateNotificationSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { notificationSettings } = req.body;
  
  if (!notificationSettings) {
    return next(createError('Notification settings are required', 400));
  }
  
  // Update notification settings
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { notificationSettings },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    data: user!.notificationSettings
  });
});
