// backend/src/server.ts
import dotenv from 'dotenv';
import app from './app';
import mongoose from 'mongoose';
import { createLogger } from './utils/logger';

// Load environment variables
dotenv.config();

const logger = createLogger('server');

// Get port from environment and store in Express
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/textbuilder';
    await mongoose.connect(mongoURI);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start the server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Start server
startServer();

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

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/generate', generationRoutes);
app.use('/api/wordpress', wordpressRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payment', paymentRoutes);

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
