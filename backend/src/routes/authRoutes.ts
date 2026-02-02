import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

router.post('/signup', async (req: Request, res: Response) => {
    console.log('Signup attempt:', req.body.email);
    try {
        const { email, password } = req.body;
        const user = await User.create({ email, password });
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        console.log('Signup successful:', email);
        res.status(201).json({ user: { id: user._id, email: user.email }, token });
    } catch (e: any) {
        console.error('Signup error:', e.message);
        res.status(400).json({ error: e.message || 'Signup failed' });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    console.log('Login attempt:', req.body.email);
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            console.log('Login failed: Invalid credentials for', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        console.log('Login successful:', email);
        res.json({ user: { id: user._id, email: user.email }, token });
    } catch (e: any) {
        console.error('Login error:', e);
        res.status(500).json({ error: 'Login failed' });
    }
});

export default router;
