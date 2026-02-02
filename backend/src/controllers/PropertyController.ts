import { Response } from 'express';
import Property from '../models/Property';
import { ScraperService } from '../services/ScraperService';
import { DataExtractionService } from '../services/DataExtractionService';
import { ReportGeneratorService } from '../services/ReportGeneratorService';

const scraper = new ScraperService();
const extractor = new DataExtractionService();
const reporter = new ReportGeneratorService();

export class PropertyController {

    // GET /api/properties
    async getAll(req: any, res: Response) {
        try {
            const properties = await Property.find({ owner: req.userId }).sort({ createdAt: -1 });
            res.json(properties);
        } catch (e) {
            res.status(500).json({ error: 'Failed to fetch properties' });
        }
    }

    // POST /api/properties/scan
    async scanUrl(req: any, res: Response) {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        try {
            const scraped = await scraper.scrape(url);
            if (!scraped) return res.status(400).json({ error: 'Scraping failed' });

            const extracted = await extractor.extract(scraped.text);

            const prop = await Property.create({
                owner: req.userId,
                title: scraped.title,
                source: 'manual',
                link: url,
                extracted_data: extracted
            });

            res.json(prop);
        } catch (e: any) {
            res.status(500).json({ error: 'Processing failed' });
        }
    }

    // GET /api/stats
    async getStats(req: any, res: Response) {
        try {
            const report = await reporter.generateDailySummary(req.userId);
            res.json(report);
        } catch (e) {
            res.status(500).json({ error: 'Failed to generate stats' });
        }
    }
}
