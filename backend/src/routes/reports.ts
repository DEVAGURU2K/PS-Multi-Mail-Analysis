import { Router, Response } from 'express';
import DailyReport from '../models/DailyReport';
import PropertyListing from '../models/PropertyListing';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Get all reports
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [reports, total] = await Promise.all([
      DailyReport.find()
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .populate('listings'),
      DailyReport.countDocuments(),
    ]);

    res.json({
      reports,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get report by date
router.get('/:date', async (req: AuthRequest, res: Response) => {
  try {
    const date = new Date(req.params.date);
    const report = await DailyReport.findOne({ date })
      .populate('listings');

    if (!report) {
      res.status(404).json({ error: 'Report not found for this date' });
      return;
    }

    res.json(report);
  } catch (error: any) {
    logger.error('Error fetching report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate report manually
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find new listings from the target date
    const listings = await PropertyListing.find({
      createdAt: {
        $gte: targetDate,
        $lt: nextDay,
      },
      isDuplicate: false,
    });

    // Check if report already exists
    let report = await DailyReport.findOne({ date: targetDate });

    if (report) {
      report.listings = listings.map(l => l._id);
      report.totalNewListings = listings.length;
      report.generatedAt = new Date();
      await report.save();
    } else {
      report = new DailyReport({
        date: targetDate,
        listings: listings.map(l => l._id),
        totalNewListings: listings.length,
        generatedAt: new Date(),
        status: 'generated',
      });
      await report.save();
    }

    await report.populate('listings');
    res.json(report);
  } catch (error: any) {
    logger.error('Error generating report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
