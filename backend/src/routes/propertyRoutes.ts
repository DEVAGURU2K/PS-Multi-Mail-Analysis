import { Router } from 'express';
import { PropertyController } from '../controllers/PropertyController';

const router = Router();
const controller = new PropertyController();

// Bind methods to controller instance to preserve 'this'
router.get('/properties', controller.getAll.bind(controller));
router.post('/properties/scan', controller.scanUrl.bind(controller));
router.get('/stats', controller.getStats.bind(controller));

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

export default router;
