import { Request, Response } from 'express';
import Property from '../models/Property';
import { ScraperService } from '../services/ScraperService';
import { DataExtractionService } from '../services/DataExtractionService';
import { ReportGeneratorService } from '../services/ReportGeneratorService';

const scraper = new ScraperService();
const extractor = new DataExtractionService();
const reporter = new ReportGeneratorService();

export class PropertyController {

    // GET /api/properties
    async getAll(req: Request, res: Response) {
        try {
            const properties = await Property.find().sort({ createdAt: -1 });
            res.json(properties);
        } catch (e) {
            res.status(500).json({ error: 'Failed to fetch properties' });
        }
    }

    // POST /api/properties/scan
    async scanUrl(req: Request, res: Response) {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        try {
            console.log(`Manual scan requested for: ${url}`);
            const scraped = await scraper.scrape(url);

            if (!scraped) {
                return res.status(400).json({ error: 'Scraping returned no data. Check URL accessibility.' });
            }

            const extracted = await extractor.extract(scraped.text);

            const prop = await Property.create({
                title: scraped.title,
                source: 'manual',
                link: url,
                extracted_data: extracted
            });

            res.json(prop);
        } catch (e: any) {
            if (e.code === 11000) {
                return res.status(409).json({ error: 'Property with this URL already exists' });
            }
            console.error(e);
            res.status(500).json({ error: 'Processing failed' });
        }
    }

    // GET /api/stats
    async getStats(req: Request, res: Response) {
        try {
            const report = await reporter.generateDailySummary();
            res.json(report);
        } catch (e) {
            res.status(500).json({ error: 'Failed to generate stats' });
        }
    }
}
