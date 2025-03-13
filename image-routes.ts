// backend/src/routes/images.ts
import express from 'express';
import { 
  generateImage,
  getEstimatedCredits
} from '../controllers/images';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Image routes
router.post('/generate', generateImage);
router.get('/estimate', getEstimatedCredits);

export default router;
