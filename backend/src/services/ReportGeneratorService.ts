import Property from '../models/Property';

export class ReportGeneratorService {
    async generateDailySummary(userId: string) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const newProperties = await Property.find({
                owner: userId,
                createdAt: { $gte: today }
            }).limit(50);

            return {
                date: today,
                count: newProperties.length,
                properties: newProperties.map(p => ({
                    title: p.title || 'No Title',
                    rent: p.extracted_data.rent || 'N/A',
                    link: p.link
                }))
            };
        } catch (e) {
            console.error("Report generation failed:", e);
            throw e;
        }
    }
}
