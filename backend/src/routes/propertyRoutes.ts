import { Router } from 'express';
import { PropertyController } from '../controllers/PropertyController';

const router = Router();
const controller = new PropertyController();

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: Get all properties
 *     description: Retrieve a list of all scraped properties from the database.
 *     responses:
 *       200:
 *         description: A list of properties.
 */
router.get('/properties', controller.getAll.bind(controller));

/**
 * @swagger
 * /properties/scan:
 *   post:
 *     summary: Scan a property URL
 *     description: Manually trigger a scan of a property listing URL to extract data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Property scanned and saved successfully.
 *       400:
 *         description: Invalid URL or missing URL.
 */
router.post('/properties/scan', controller.scanUrl.bind(controller));

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Get property stats
 *     description: Retrieve daily statistics of property listings.
 *     responses:
 *       200:
 *         description: Daily property statistics.
 */
router.get('/stats', controller.getStats.bind(controller));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API server is running correctly.
 *     responses:
 *       200:
 *         description: Server is healthy.
 */
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

export default router;
