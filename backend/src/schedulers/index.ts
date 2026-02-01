import cron from 'node-cron';
import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';
import EmailAccount from '../models/EmailAccount';
import logger from '../utils/logger';

let emailMonitorQueue: Queue | null = null;
let reportQueue: Queue | null = null;

export const initializeSchedulers = (): void => {
  try {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    };

    emailMonitorQueue = new Queue('email-monitor', { connection });
    reportQueue = new Queue('report-generation', { connection });

    // Schedule email monitoring every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      logger.info('Running scheduled email monitoring');
      await scheduleEmailMonitoring();
    });

    // Schedule daily report generation at midnight
    const reportSchedule = process.env.REPORT_SCHEDULE || '0 0 * * *';
    cron.schedule(reportSchedule, async () => {
      logger.info('Running scheduled report generation');
      await scheduleReportGeneration();
    });

    logger.info('Schedulers initialized successfully');
  } catch (error) {
    logger.error('Error initializing schedulers:', error);
    throw error;
  }
};

const scheduleEmailMonitoring = async (): Promise<void> => {
  try {
    const activeAccounts = await EmailAccount.find({ isActive: true });

    for (const account of activeAccounts) {
      await emailMonitorQueue?.add('monitor-email', {
        accountId: account._id.toString(),
        email: account.email,
        provider: account.provider,
      });
    }

    logger.info(`Scheduled email monitoring for ${activeAccounts.length} accounts`);
  } catch (error) {
    logger.error('Error scheduling email monitoring:', error);
  }
};

const scheduleReportGeneration = async (): Promise<void> => {
  try {
    await reportQueue?.add('generate-daily-report', {
      date: new Date().toISOString().split('T')[0],
    });
    logger.info('Scheduled daily report generation');
  } catch (error) {
    logger.error('Error scheduling report generation:', error);
  }
};
