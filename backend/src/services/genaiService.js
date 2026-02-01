const axios = require('axios');
const logger = require('../utils/logger');

class GenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.provider = process.env.OPENAI_API_KEY ? 'openai' : 'anthropic';
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.baseURL = this.provider === 'openai' 
      ? 'https://api.openai.com/v1'
      : 'https://api.anthropic.com/v1';
  }

  /**
   * Classify if a URL is a property listing
   */
  async classifyPropertyLink(url) {
    const prompt = `Is this URL a property listing? Respond with JSON only: {"isPropertyListing": boolean, "confidence": number (0-1), "reason": string}
    
URL: ${url}`;

    try {
      const response = await this._callAPI(prompt, 'classify');
      return this._parseJSONResponse(response);
    } catch (error) {
      logger.error('Error classifying property link:', error);
      // Fallback: check if URL contains property-related keywords
      return this._fallbackLinkClassification(url);
    }
  }

  /**
   * Extract property details from HTML content
   */
  async extractPropertyData(htmlContent, url) {
    const prompt = `Extract property details from this HTML content. Return JSON with these exact fields:
{
  "bhk": number (or null),
  "unitType": string (one of: "Apartment", "House", "Villa", "Studio", "Penthouse", "Other"),
  "size": {"value": number, "unit": "sqft" or "sqm"},
  "rent": {"value": number, "currency": "INR" or "USD", "period": "month" or "year"},
  "address": {"full": string, "city": string, "state": string, "pincode": string}
}

HTML Content (first 5000 chars):
${htmlContent.substring(0, 5000)}

URL: ${url}

Return only valid JSON, no additional text.`;

    try {
      const response = await this._callAPI(prompt, 'extract');
      const data = this._parseJSONResponse(response);
      return this._validatePropertyData(data);
    } catch (error) {
      logger.error('Error extracting property data:', error);
      throw error;
    }
  }

  /**
   * Classify if email is property-related
   */
  async classifyEmail(emailContent) {
    const prompt = `Is this email about property inquiries or listings? Extract all property listing URLs.
Respond with JSON only:
{
  "isPropertyRelated": boolean,
  "propertyLinks": [string array of URLs],
  "confidence": number (0-1)
}

Email Content:
${emailContent.substring(0, 2000)}`;

    try {
      const response = await this._callAPI(prompt, 'classify');
      return this._parseJSONResponse(response);
    } catch (error) {
      logger.error('Error classifying email:', error);
      return { isPropertyRelated: false, propertyLinks: [], confidence: 0 };
    }
  }

  /**
   * Generate CSS selectors for scraping
   */
  async generateSelectors(htmlSample) {
    const prompt = `Generate CSS selectors to extract property details from this HTML structure.
Return JSON:
{
  "bhk": "css selector",
  "unitType": "css selector",
  "size": "css selector",
  "rent": "css selector",
  "address": "css selector"
}

HTML Sample:
${htmlSample.substring(0, 3000)}`;

    try {
      const response = await this._callAPI(prompt, 'selectors');
      return this._parseJSONResponse(response);
    } catch (error) {
      logger.error('Error generating selectors:', error);
      return null;
    }
  }

  /**
   * Call GenAI API
   */
  async _callAPI(prompt, taskType) {
    if (!this.apiKey) {
      throw new Error('GenAI API key not configured');
    }

    if (this.provider === 'openai') {
      return this._callOpenAI(prompt);
    } else {
      return this._callAnthropic(prompt);
    }
  }

  /**
   * Call OpenAI API
   */
  async _callOpenAI(prompt) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that extracts structured data from web content. Always respond with valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      logger.error('OpenAI API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Call Anthropic Claude API
   */
  async _callAnthropic(prompt) {
    try {
      const response = await axios.post(
        `${this.baseURL}/messages`,
        {
          model: 'claude-3-haiku-20240307', // Free tier model
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.content[0].text.trim();
    } catch (error) {
      logger.error('Anthropic API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Parse JSON response from API
   */
  _parseJSONResponse(response) {
    try {
      // Remove markdown code blocks if present
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      logger.error('Error parsing JSON response:', error);
      logger.debug('Response was:', response);
      throw new Error('Invalid JSON response from GenAI');
    }
  }

  /**
   * Validate extracted property data
   */
  _validatePropertyData(data) {
    const validated = {
      bhk: typeof data.bhk === 'number' ? data.bhk : null,
      unitType: ['Apartment', 'House', 'Villa', 'Studio', 'Penthouse', 'Other'].includes(data.unitType) 
        ? data.unitType 
        : null,
      size: data.size && typeof data.size.value === 'number' 
        ? { value: data.size.value, unit: data.size.unit || 'sqft' }
        : null,
      rent: data.rent && typeof data.rent.value === 'number'
        ? {
            value: data.rent.value,
            currency: data.rent.currency || 'INR',
            period: data.rent.period || 'month',
          }
        : null,
      address: data.address || null,
    };

    return validated;
  }

  /**
   * Fallback link classification using pattern matching
   */
  _fallbackLinkClassification(url) {
    const propertyKeywords = [
      'property', 'listing', 'rent', 'sale', 'apartment', 'house',
      '99acres', 'magicbricks', 'housing', 'makaan', 'commonfloor',
      'bhk', 'bedroom', 'sqft', 'sqm',
    ];

    const lowerUrl = url.toLowerCase();
    const matches = propertyKeywords.filter(keyword => lowerUrl.includes(keyword)).length;
    const confidence = Math.min(matches / propertyKeywords.length, 1);

    return {
      isPropertyListing: confidence > 0.3,
      confidence,
      reason: `Pattern matching found ${matches} property-related keywords`,
    };
  }
}

module.exports = new GenAIService();
