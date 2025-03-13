// backend/src/routes/settings.ts
import express from 'express';
import { 
  getUserPreferences,
  updateUserPreferences,
  getUserApiKeys,
  generateApiKey,
  deleteApiKey,
  getUserNotificationSettings,
  updateNotificationSettings
} from '../controllers/settings';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Preferences routes
router.get('/preferences', getUserPreferences);
router.put('/preferences', updateUserPreferences);

// API key routes
router.get('/api-keys', getUserApiKeys);
router.post('/api-keys', generateApiKey);
router.delete('/api-keys/:id', deleteApiKey);

// Notification settings routes
router.get('/notifications', getUserNotificationSettings);
router.put('/notifications', updateNotificationSettings);

export default router;
