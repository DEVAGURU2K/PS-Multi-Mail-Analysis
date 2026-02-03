import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import Mailbox from '../models/Mailbox';
import { EncryptionService } from '../services/EncryptionService';

const router = Router();

/**
 * @swagger
 * /mailboxes:
 *   get:
 *     summary: Get all mailboxes
 *     description: Retrieve all IMAP mailboxes configured for the current user.
 *     responses:
 *       200:
 *         description: A list of mailboxes.
 *       500:
 *         description: Failed to fetch mailboxes.
 */
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

/**
 * @swagger
 * /mailboxes:
 *   post:
 *     summary: Create a new mailbox
 *     description: Add a new IMAP mailbox configuration to monitor.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               host:
 *                 type: string
 *               port:
 *                 type: number
 *               tls:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Mailbox created successfully.
 *       400:
 *         description: Failed to create mailbox.
 */
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

/**
 * @swagger
 * /mailboxes/{id}:
 *   delete:
 *     summary: Delete a mailbox
 *     description: Remove a mailbox configuration by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mailbox removed.
 *       400:
 *         description: Delete failed.
 */
router.delete('/:id', authMiddleware, async (req: any, res: Response) => {
    try {
        await Mailbox.findOneAndDelete({ _id: req.params.id, owner: req.userId });
        res.json({ message: 'Mailbox removed' });
    } catch (e) {
        res.status(400).json({ error: 'Delete failed' });
    }
});

export default router;
