import { Router, Response } from 'express';
import EmailAccount from '../models/EmailAccount';
import { AuthRequest } from '../middleware/auth';
import { encrypt, decrypt } from '../utils/encryption';
import logger from '../utils/logger';

const router = Router();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

// Get all email accounts for user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const accounts = await EmailAccount.find({ userId: req.user?.id });
    res.json(accounts);
  } catch (error: any) {
    logger.error('Error fetching email accounts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create email account
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { email, provider, password, oauthToken, imapConfig, folders } = req.body;

    if (!email || !provider) {
      res.status(400).json({ error: 'Email and provider are required' });
      return;
    }

    // Encrypt password if provided
    const encryptedPassword = password ? encrypt(password, ENCRYPTION_KEY) : undefined;

    const account = new EmailAccount({
      userId: req.user?.id,
      email,
      provider,
      credentials: {
        password: encryptedPassword,
        oauthToken,
      },
      imapConfig: imapConfig || {
        host: provider === 'gmail' ? 'imap.gmail.com' : '',
        port: 993,
        secure: true,
      },
      folders: folders || ['INBOX', 'Sent Items'],
    });

    await account.save();
    res.status(201).json(account);
  } catch (error: any) {
    logger.error('Error creating email account:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update email account
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const account = await EmailAccount.findOne({
      _id: req.params.id,
      userId: req.user?.id,
    });

    if (!account) {
      res.status(404).json({ error: 'Email account not found' });
      return;
    }

    const { isActive, checkInterval, folders } = req.body;
    if (isActive !== undefined) account.isActive = isActive;
    if (checkInterval !== undefined) account.checkInterval = checkInterval;
    if (folders) account.folders = folders;

    await account.save();
    res.json(account);
  } catch (error: any) {
    logger.error('Error updating email account:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete email account
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const account = await EmailAccount.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?.id,
    });

    if (!account) {
      res.status(404).json({ error: 'Email account not found' });
      return;
    }

    res.json({ message: 'Email account deleted' });
  } catch (error: any) {
    logger.error('Error deleting email account:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
