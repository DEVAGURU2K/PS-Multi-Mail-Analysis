import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

export interface ExtractedPropertyData {
    rent?: string;
    bhk?: string;
    address?: string;
    unit_type?: string;
    size?: string;
    description?: string;
}

export class DataExtractionService {
    private openai: OpenAI | null = null;

    constructor() {
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10) {
            console.log("Initializing OpenAI for extraction...");
            this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        } else {
            console.warn("OPENAI_API_KEY missing or invalid. Using regex fallback only.");
        }
    }

    async extract(text: string): Promise<ExtractedPropertyData> {
        if (this.openai) {
            try {
                console.log("Attempting AI extraction...");
                const completion = await this.openai.chat.completions.create({
                    messages: [
                        {
                            role: 'system',
                            content: `You are a real estate data extractor. Extract the following fields from the property listing text: rent, bhk (e.g. 2 BHK, 3 BHK), address, unit_type (e.g. Apartment, Villa), size (e.g. 1500 sqft), description (short summary). Return ONLY valid JSON.`
                        },
                        { role: 'user', content: text.substring(0, 2000) } // Limit text length
                    ],
                    model: 'gpt-3.5-turbo-0125',
                    response_format: { type: 'json_object' }
                });

                const content = completion.choices[0].message.content;
                if (content) {
                    return JSON.parse(content);
                }
            } catch (e) {
                console.error("AI Extraction failed, falling back to regex", e);
            }
        }

        return this.regexExtract(text);
    }

    private regexExtract(text: string): ExtractedPropertyData {
        console.log("Running Regex extraction...");
        // Basic regex patterns - can be improved
        const rentMatch = text.match(/(?:rent|price)\s*:?\s*[₹$€]?\s*([\d,]+)/i);
        const bhkMatch = text.match(/(\d)\s*bhk/i);
        const sizeMatch = text.match(/([\d,]+)\s*(?:sqft|sq\.ft|ft2)/i);
        const typeMatch = text.match(/(apartment|villa|flat|house|studio)/i);

        return {
            rent: rentMatch ? rentMatch[1] : undefined,
            bhk: bhkMatch ? bhkMatch[1] + ' BHK' : undefined,
            size: sizeMatch ? sizeMatch[1] + ' sqft' : undefined,
            unit_type: typeMatch ? typeMatch[1] : 'Unknown',
            description: text.substring(0, 150).replace(/\n/g, ' ').trim() + '...'
        };
    }
}
