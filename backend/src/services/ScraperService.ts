import { chromium, Browser, Page } from 'playwright';

export interface ScrapedData {
    title: string;
    text: string;
    html: string;
    images: string[];
}

export class ScraperService {
    private browser: Browser | null = null;

    async init() {
        if (!this.browser) {
            console.log("Launching Playwright Browser...");
            this.browser = await chromium.launch({ headless: true });
        }
    }

    async scrape(url: string): Promise<ScrapedData | null> {
        if (!this.browser) await this.init();

        // Safety check
        if (!url || !url.startsWith('http')) {
            console.error("Invalid URL to scrape:", url);
            return null;
        }

        const page = await this.browser!.newPage();
        try {
            console.log(`Scraping URL: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            const title = await page.title();
            // Extract visible text logic (simplified)
            const text = await page.evaluate(() => document.body.innerText);
            const html = await page.content();

            // Extract images (first 5 relevant ones)
            const images = await page.evaluate(() => {
                const imgs = Array.from(document.querySelectorAll('img'));
                return imgs
                    .map(img => img.src)
                    .filter(src => src.startsWith('http'))
                    .filter(src => !src.includes('icon') && !src.includes('logo')) // Basic filter
                    .slice(0, 5);
            });

            console.log(`Scraped: ${title}`);
            return { title, text, html, images };
        } catch (e) {
            console.error(`Scraping failed for ${url}:`, e);
            return null;
        } finally {
            await page.close();
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
