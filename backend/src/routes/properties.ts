import { Router, Response } from 'express';
import PropertyListing from '../models/PropertyListing';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Get all properties with filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      bhk,
      minRent,
      maxRent,
      city,
      status,
      emailAccountId,
    } = req.query;

    const query: any = {};

    if (bhk) query.bhk = parseInt(bhk as string);
    if (minRent || maxRent) {
      query['rent.value'] = {};
      if (minRent) query['rent.value'].$gte = parseInt(minRent as string);
      if (maxRent) query['rent.value'].$lte = parseInt(maxRent as string);
    }
    if (city) query['address.city'] = city;
    if (status) query.status = status;
    if (emailAccountId) query.emailAccountId = emailAccountId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [properties, total] = await Promise.all([
      PropertyListing.find(query)
        .populate('emailAccountId', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      PropertyListing.countDocuments(query),
    ]);

    res.json({
      properties,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get property by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const property = await PropertyListing.findById(req.params.id)
      .populate('emailAccountId', 'email')
      .populate('emailId');

    if (!property) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    res.json(property);
  } catch (error: any) {
    logger.error('Error fetching property:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
