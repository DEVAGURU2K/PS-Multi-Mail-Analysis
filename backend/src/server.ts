import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import logger from './utils/logger';
import { connectRedis } from './config/redis';
import { initializeWorkers } from './workers';
import { initializeSchedulers } from './schedulers';

// Import routes
import authRoutes from './routes/auth';
import emailAccountRoutes from './routes/emailAccounts';
import propertyRoutes from './routes/properties';
import reportRoutes from './routes/reports';
import healthRoutes from './routes/health';

// Import middleware
import errorHandler from './middleware/errorHandler';
import { authenticate } from './middleware/auth';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Health check (no auth required)
app.use('/api/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/email-accounts', authenticate, emailAccountRoutes);
app.use('/api/properties', authenticate, propertyRoutes);
app.use('/api/reports', authenticate, reportRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-monitor', {
  // @ts-ignore - mongoose types issue
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    logger.info('MongoDB connected successfully');
    
    // Connect to Redis
    connectRedis()
      .then(() => {
        logger.info('Redis connected successfully');
        
        // Initialize workers
        initializeWorkers();
        
        // Initialize schedulers
        initializeSchedulers();
        
        // Start server
        app.listen(PORT, () => {
          logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
        });
      })
      .catch((error: Error) => {
        logger.error('Redis connection failed:', error);
        process.exit(1);
      });
  })
  .catch((error: Error) => {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

export default app;
