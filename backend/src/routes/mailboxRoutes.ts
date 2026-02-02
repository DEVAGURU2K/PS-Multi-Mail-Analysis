import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import Mailbox from '../models/Mailbox';
import { EncryptionService } from '../services/EncryptionService';

const router = Router();

// GET /mailboxes
router.get('/', authMiddleware, async (req: any, res: Response) => {
    try {
        const mailboxes = await Mailbox.find({ owner: req.userId });
        res.json(mailboxes.map(m => ({
            id: m._id,
            email: m.email,
            host: m.host,
            isActive: m.isActive
        })));
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch mailboxes' });
    }
});

// POST /mailboxes
router.post('/', authMiddleware, async (req: any, res: Response) => {
    try {
        const { email, password, host, port, tls } = req.body;
        const encryptedPassword = EncryptionService.encrypt(password);

        const mailbox = await Mailbox.create({
            owner: req.userId,
            email,
            password: encryptedPassword,
            host,
            port,
            tls
        });

        res.status(201).json({ id: mailbox._id, email: mailbox.email });
    } catch (e: any) {
        console.error('Mailbox creation error:', e);
        res.status(400).json({ error: 'Failed to create mailbox', details: e.message });
    }
});

// DELETE /mailboxes/:id
router.delete('/:id', authMiddleware, async (req: any, res: Response) => {
    try {
        await Mailbox.findOneAndDelete({ _id: req.params.id, owner: req.userId });
        res.json({ message: 'Mailbox removed' });
    } catch (e) {
        res.status(400).json({ error: 'Delete failed' });
    }
});

export default router;
