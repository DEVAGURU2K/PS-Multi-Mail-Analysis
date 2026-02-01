import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';

// Import worker processors
import emailMonitorProcessor from './emailMonitorProcessor';
import webScraperProcessor from './webScraperProcessor';

let emailMonitorWorker: Worker | null = null;
let webScraperWorker: Worker | null = null;

export const initializeWorkers = (): void => {
  try {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    };

    // Email Monitor Worker
    emailMonitorWorker = new Worker(
      'email-monitor',
      emailMonitorProcessor,
      {
        connection,
        concurrency: 5, // Process 5 emails concurrently
        limiter: {
          max: 10,
          duration: 1000, // 10 jobs per second
        },
      }
    );

    emailMonitorWorker.on('completed', (job) => {
      logger.info(`Email monitor job ${job.id} completed`);
    });

    emailMonitorWorker.on('failed', (job, err) => {
      logger.error(`Email monitor job ${job?.id} failed:`, err);
    });

    // Web Scraper Worker
    webScraperWorker = new Worker(
      'web-scraper',
      webScraperProcessor,
      {
        connection,
        concurrency: 3, // Process 3 scraping jobs concurrently
        limiter: {
          max: 5,
          duration: 1000, // 5 jobs per second
        },
      }
    );

    webScraperWorker.on('completed', (job) => {
      logger.info(`Web scraper job ${job.id} completed`);
    });

    webScraperWorker.on('failed', (job, err) => {
      logger.error(`Web scraper job ${job?.id} failed:`, err);
    });

    logger.info('Workers initialized successfully');
  } catch (error) {
    logger.error('Error initializing workers:', error);
    throw error;
  }
};

export const closeWorkers = async (): Promise<void> => {
  if (emailMonitorWorker) {
    await emailMonitorWorker.close();
  }
  if (webScraperWorker) {
    await webScraperWorker.close();
  }
};
