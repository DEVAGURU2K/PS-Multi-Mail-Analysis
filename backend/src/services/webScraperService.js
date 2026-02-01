const { chromium } = require('playwright');
const logger = require('../utils/logger');
const genaiService = require('./genaiService');
const PropertyListing = require('../models/PropertyListing');
const ProcessedEmail = require('../models/ProcessedEmail');

class WebScraperService {
  constructor() {
    this.browser = null;
    this.contexts = new Map(); // Store browser contexts per domain
  }

  /**
   * Initialize browser
   */
  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      logger.info('Playwright browser initialized');
    }
  }

  /**
   * Scrape property listing from URL
   */
  async scrapeProperty(url, emailAccountId, emailId) {
    try {
      await this.initialize();

      // Get or create browser context for this domain
      const domain = new URL(url).hostname;
      let context = this.contexts.get(domain);

      if (!context) {
        context = await this.browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          viewport: { width: 1920, height: 1080 },
        });
        this.contexts.set(domain, context);
      }

      const page = await context.newPage();

      try {
        // Navigate to URL with timeout
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Wait for content to load
        await page.waitForTimeout(2000);

        // Extract HTML content
        const htmlContent = await page.content();

        // Extract text content
        const textContent = await page.textContent('body');

        // Use GenAI to extract structured data
        const extractedData = await genaiService.extractPropertyData(htmlContent, url);

        // Validate and normalize data
        const normalizedData = this._normalizeData(extractedData, url);

        // Check for duplicates
        const duplicate = await this._checkDuplicate(normalizedData, url);

        if (duplicate) {
          logger.info(`Duplicate property found: ${url}`);
          return {
            success: true,
            isDuplicate: true,
            duplicateOf: duplicate._id,
          };
        }

        // Save to database
        const propertyListing = new PropertyListing({
          sourceUrl: url,
          emailAccountId: emailAccountId,
          emailId: emailId,
          ...normalizedData,
          scrapedData: {
            html: htmlContent.substring(0, 10000), // Store first 10KB
            text: textContent?.substring(0, 5000), // Store first 5KB
          },
          status: 'new',
        });

        await propertyListing.save();

        logger.info(`Successfully scraped and saved property: ${url}`);

        return {
          success: true,
          isDuplicate: false,
          propertyId: propertyListing._id,
        };
      } finally {
        await page.close();
      }
    } catch (error) {
      logger.error(`Error scraping property ${url}:`, error);
      throw error;
    }
  }

  /**
   * Normalize extracted data
   */
  _normalizeData(data, url) {
    const normalized = {
      bhk: null,
      unitType: null,
      size: null,
      rent: null,
      address: null,
    };

    // Normalize BHK
    if (data.bhk && typeof data.bhk === 'number') {
      normalized.bhk = Math.max(0, Math.floor(data.bhk));
    } else if (data.bhk && typeof data.bhk === 'string') {
      const bhkMatch = data.bhk.match(/(\d+)/);
      if (bhkMatch) {
        normalized.bhk = parseInt(bhkMatch[1]);
      }
    }

    // Normalize unit type
    if (data.unitType) {
      const unitTypes = ['Apartment', 'House', 'Villa', 'Studio', 'Penthouse', 'Other'];
      normalized.unitType = unitTypes.includes(data.unitType) ? data.unitType : 'Other';
    }

    // Normalize size
    if (data.size && data.size.value) {
      normalized.size = {
        value: Math.max(0, parseFloat(data.size.value)),
        unit: data.size.unit === 'sqm' ? 'sqm' : 'sqft',
      };
    }

    // Normalize rent
    if (data.rent && data.rent.value) {
      normalized.rent = {
        value: Math.max(0, parseFloat(data.rent.value)),
        currency: data.rent.currency || 'INR',
        period: data.rent.period === 'year' ? 'year' : 'month',
      };
    }

    // Normalize address
    if (data.address) {
      normalized.address = {
        full: data.address.full || '',
        city: data.address.city || '',
        state: data.address.state || '',
        pincode: data.address.pincode || '',
      };
    }

    return normalized;
  }

  /**
   * Check for duplicate property
   */
  async _checkDuplicate(data, url) {
    // Check by URL first
    const existingByUrl = await PropertyListing.findOne({ sourceUrl: url });
    if (existingByUrl) {
      return existingByUrl;
    }

    // Check by address and similar characteristics
    if (data.address && data.address.full) {
      const existingByAddress = await PropertyListing.findOne({
        'address.full': { $regex: new RegExp(data.address.full.substring(0, 20), 'i') },
        bhk: data.bhk,
        'rent.value': { $gte: (data.rent?.value || 0) * 0.9, $lte: (data.rent?.value || 0) * 1.1 },
      });

      if (existingByAddress) {
        return existingByAddress;
      }
    }

    return null;
  }

  /**
   * Close browser and all contexts
   */
  async close() {
    for (const [domain, context] of this.contexts.entries()) {
      try {
        await context.close();
      } catch (error) {
        logger.error(`Error closing context for ${domain}:`, error);
      }
    }
    this.contexts.clear();

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Playwright browser closed');
    }
  }
}

module.exports = new WebScraperService();
