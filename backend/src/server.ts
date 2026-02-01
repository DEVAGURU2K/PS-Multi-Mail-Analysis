import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/database';
import propertyRoutes from './routes/propertyRoutes';
import { EmailMonitorService } from './services/EmailMonitorService';
import { ScraperService } from './services/ScraperService';
import { DataExtractionService } from './services/DataExtractionService';
import Property from './models/Property';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') }); // Try from running dir perspective
if (!process.env.PORT) dotenv.config(); // Fallback

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', propertyRoutes);

// --- Background Worker Logic ---
const initBackgroundServices = () => {
    const emailConfig = {
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASS || '',
        host: process.env.SMTP_HOST || 'imap.gmail.com',
        port: 993,
        tls: true
    };

    if (emailConfig.user && emailConfig.password && emailConfig.password !== 'your-app-password') {
        const monitor = new EmailMonitorService(emailConfig);
        const scraper = new ScraperService();
        const extractor = new DataExtractionService();

        console.log("Starting Email Monitor...");

        monitor.on('email', async (parsedEmail) => {
            const text = parsedEmail.text || '';
            const subject = parsedEmail.subject || 'No Subject';
            console.log(`Processing email: ${subject}`);

            // Regex to find URL
            const linkMatch = text.match(/https?:\/\/[^\s>"]+/);

            if (linkMatch) {
                const url = linkMatch[0];
                console.log(`Found link: ${url}`);
                try {
                    const scraped = await scraper.scrape(url);
                    if (scraped) {
                        const data = await extractor.extract(scraped.text);
                        await Property.create({
                            title: scraped.title,
                            source: 'email',
                            link: url,
                            sender: parsedEmail.from?.text,
                            raw_email_id: parsedEmail.messageId,
                            extracted_data: data
                        });
                        console.log(`✅ Analyzed and saved: ${scraped.title}`);
                    }
                } catch (e) {
                    console.error("Pipeline failed for email link", e);
                }
            } else {
                console.log("No links found in email.");
            }
        });

        monitor.connect();
    } else {
        console.log("⚠️  Email Monitor NOT started. Missing configured credentials in .env");
    }
};

initBackgroundServices();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
