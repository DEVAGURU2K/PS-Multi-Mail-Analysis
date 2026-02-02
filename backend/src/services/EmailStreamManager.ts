import Mailbox from '../models/Mailbox';
import { EmailMonitorService } from './EmailMonitorService';
import { EncryptionService } from './EncryptionService';
import { ScraperService } from './ScraperService';
import { DataExtractionService } from './DataExtractionService';
import Property from '../models/Property';

export class EmailStreamManager {
    private streams: Map<string, EmailMonitorService> = new Map();
    private scraper = new ScraperService();
    private extractor = new DataExtractionService();

    async startAll() {
        const mailboxes = await Mailbox.find({ isActive: true });
        console.log(`Initializing ${mailboxes.length} email streams...`);

        for (const box of mailboxes) {
            this.startStream(box);
        }
    }

    startStream(box: any) {
        if (this.streams.has(box._id.toString())) return;

        const decryptedPassword = EncryptionService.decrypt(box.password);
        const monitor = new EmailMonitorService({
            user: box.email,
            password: decryptedPassword,
            host: box.host,
            port: box.port,
            tls: box.tls
        });

        monitor.on('email', async (parsedEmail) => {
            const text = parsedEmail.text || '';
            const linkMatch = text.match(/https?:\/\/[^\s>"]+/);

            if (linkMatch) {
                const url = linkMatch[0];
                try {
                    const scraped = await scraper.scrape(url);
                    if (scraped) {
                        const data = await extractor.extract(scraped.text);
                        await Property.create({
                            owner: box.owner,
                            title: scraped.title,
                            source: 'email',
                            link: url,
                            sender: parsedEmail.from?.text,
                            raw_email_id: parsedEmail.messageId,
                            extracted_data: data
                        });
                        console.log(`✅ [${box.email}] Analyzed: ${scraped.title}`);
                    }
                } catch (e) {
                    console.error(`Pipeline failed for ${box.email}`, e);
                }
            }
        });

        monitor.on('error', (err) => {
            console.error(`❌ [${box.email}] Stream error:`, err.message);
            this.streams.delete(box._id.toString());
        });

        monitor.connect();
        this.streams.set(box._id.toString(), monitor);
    }

    stopStream(mailboxId: string) {
        const stream = this.streams.get(mailboxId);
        if (stream) {
            // Need a close method in EmailMonitorService or wait for timeout
            this.streams.delete(mailboxId);
        }
    }
}

const scraper = new ScraperService();
const extractor = new DataExtractionService();
