import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '../config/redis';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: 'disconnected',
    };

    try {
      const redis = getRedisClient();
      await redis.ping();
      health.redis = 'connected';
    } catch (error) {
      health.redis = 'disconnected';
    }

    const statusCode = health.database === 'connected' && health.redis === 'connected' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
    });
  }
});

export default router;
