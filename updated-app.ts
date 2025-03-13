// backend/src/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/error';

// Create Express server
const app: Express = express();

const logger = createLogger('app');

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

// Import routes
import authRoutes from './routes/auth';
import articleRoutes from './routes/articles';
import generationRoutes from './routes/generation';
import wordpressRoutes from './routes/wordpress';
import settingsRoutes from './routes/settings';
import paymentRoutes from './routes/payment';
import imageRoutes from './routes/images'; // Add the new image routes

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/generate', generationRoutes);
app.use('/api/wordpress', wordpressRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/images', imageRoutes); // Mount the image routes

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Not found - ${req.originalUrl}`
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
