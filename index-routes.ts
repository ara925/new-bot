// backend/src/routes/index.ts
import express from 'express';
import authRoutes from './auth';
import articleRoutes from './articles';
import generationRoutes from './generation';
import wordpressRoutes from './wordpress';
import settingsRoutes from './settings';
import paymentRoutes from './payment';
import imageRoutes from './images';

const router = express.Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/articles', articleRoutes);
router.use('/generate', generationRoutes);
router.use('/wordpress', wordpressRoutes);
router.use('/settings', settingsRoutes);
router.use('/payment', paymentRoutes);
router.use('/images', imageRoutes);

export default router;
