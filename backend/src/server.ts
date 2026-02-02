import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/database';
import propertyRoutes from './routes/propertyRoutes';
import authRoutes from './routes/authRoutes';
import mailboxRoutes from './routes/mailboxRoutes';
import { EmailStreamManager } from './services/EmailStreamManager';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.PORT) dotenv.config();

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception:', err.message);
    // Consider graceful shutdown or logging to a persistent store
    // For now, just log and exit
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
    // Log the unhandled rejection, but don't necessarily exit immediately
    // This allows the application to continue running if the rejection isn't critical
});

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Routes
console.log("Mounting /api/auth...");
app.use('/api/auth', authRoutes);
console.log("Mounting /api/mailboxes...");
app.use('/api/mailboxes', mailboxRoutes);
console.log("Mounting /api...");
app.use('/api', propertyRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Dynamic Background Worker ---
const streamManager = new EmailStreamManager();
streamManager.startAll().catch(err => console.error("Stream Manager failed to start", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
