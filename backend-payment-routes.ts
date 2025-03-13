// backend/src/routes/payment.ts
import express from 'express';
import {
  createPaymentIntent,
  processPayment,
  webhook,
  getPlans,
  getSubscription,
  buyCredits
} from '../controllers/payment';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

// Protected routes
router.use(protect);
router.post('/create-payment-intent', createPaymentIntent);
router.post('/process-payment', processPayment);
router.get('/plans', getPlans);
router.get('/subscription', getSubscription);
router.post('/buy-credits', buyCredits);

export default router;
