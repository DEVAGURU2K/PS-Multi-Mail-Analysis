const imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const logger = require('../utils/logger');
const ProcessedEmail = require('../models/ProcessedEmail');
const genaiService = require('./genaiService');
const { encrypt, decrypt } = require('../utils/encryption');
const { Queue } = require('bullmq');
const { getRedisClient } = require('../config/redis');

class EmailMonitorService {
  constructor() {
    this.scrapingQueue = new Queue('property-scraping', {
      connection: getRedisClient(),
    });
    this.connections = new Map(); // Store active IMAP connections
  }

  /**
   * Monitor emails for a specific account
   */
  async monitorAccount(emailAccount) {
    const accountId = emailAccount._id.toString();
    logger.info(`Starting email monitoring for account: ${emailAccount.email}`);

    try {
      // Decrypt credentials
      const password = decrypt(emailAccount.credentials.password, process.env.ENCRYPTION_KEY);

      // Create IMAP connection
      const connection = await this._createConnection(emailAccount, password);
      this.connections.set(accountId, connection);

      // Process each folder
      for (const folder of emailAccount.folders) {
        await this._processFolder(connection, emailAccount, folder);
      }

      // Update last checked timestamp
      emailAccount.lastChecked = new Date();
      emailAccount.errorCount = 0;
      emailAccount.lastError = null;
      await emailAccount.save();

      logger.info(`Completed monitoring for account: ${emailAccount.email}`);
    } catch (error) {
      logger.error(`Error monitoring account ${emailAccount.email}:`, error);
      
      // Update error count
      emailAccount.errorCount = (emailAccount.errorCount || 0) + 1;
      emailAccount.lastError = error.message;
      await emailAccount.save();

      // Disable account if too many errors
      if (emailAccount.errorCount >= 5) {
        emailAccount.isActive = false;
        await emailAccount.save();
        logger.warn(`Account ${emailAccount.email} disabled due to repeated errors`);
      }

      throw error;
    }
  }

  /**
   * Create IMAP connection
   */
  async _createConnection(emailAccount, password) {
    const config = {
      imap: {
        user: emailAccount.email,
        password: password,
        host: emailAccount.imapConfig.host,
        port: emailAccount.imapConfig.port,
        tls: emailAccount.imapConfig.secure,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
      },
    };

    try {
      const connection = await imap.connect(config);
      return connection;
    } catch (error) {
      logger.error(`IMAP connection failed for ${emailAccount.email}:`, error);
      throw error;
    }
  }

  /**
   * Process emails in a folder
   */
  async _processFolder(connection, emailAccount, folderName) {
    try {
      await connection.openBox(folderName);

      // Search for unread emails
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: '',
        struct: true,
      };

      const messages = await connection.search(searchCriteria, fetchOptions);

      if (messages.length === 0) {
        logger.debug(`No unread emails in ${folderName} for ${emailAccount.email}`);
        return;
      }

      logger.info(`Found ${messages.length} unread emails in ${folderName} for ${emailAccount.email}`);

      // Process each email
      for (const message of messages) {
        try {
          await this._processEmail(connection, message, emailAccount, folderName);
        } catch (error) {
          logger.error(`Error processing email:`, error);
          // Continue with next email
        }
      }
    } catch (error) {
      logger.error(`Error processing folder ${folderName}:`, error);
      throw error;
    }
  }

  /**
   * Process individual email
   */
  async _processEmail(connection, message, emailAccount, folderName) {
    const allParts = this._getParts(message.attributes.struct);
    const part = allParts.find(part => part.which === 'TEXT');

    if (!part) {
      logger.warn('Email has no text part');
      return;
    }

    const partData = await connection.getPartData(message, part);
    const parsed = await simpleParser(partData);

    // Extract links from email body
    const links = this._extractLinks(parsed.html || parsed.text || '');

    // Check if email already processed
    const existingEmail = await ProcessedEmail.findOne({
      messageId: message.attributes.uid.toString(),
      emailAccountId: emailAccount._id,
    });

    if (existingEmail) {
      logger.debug(`Email ${message.attributes.uid} already processed`);
      return;
    }

    // Use GenAI to classify email and extract property links
    let propertyLinks = [];
    try {
      const emailContent = parsed.html || parsed.text || '';
      const classification = await genaiService.classifyEmail(emailContent);
      
      if (classification.isPropertyRelated && classification.propertyLinks) {
        propertyLinks = classification.propertyLinks;
      } else {
        // Fallback: filter links using pattern matching
        propertyLinks = this._filterPropertyLinks(links);
      }
    } catch (error) {
      logger.error('Error classifying email with GenAI, using fallback:', error);
      propertyLinks = this._filterPropertyLinks(links);
    }

    // Save processed email
    const processedEmail = new ProcessedEmail({
      emailAccountId: emailAccount._id,
      messageId: message.attributes.uid.toString(),
      subject: parsed.subject || '',
      from: parsed.from?.text || '',
      to: parsed.to?.text || '',
      date: parsed.date || new Date(),
      body: {
        html: parsed.html || '',
        text: parsed.text || '',
      },
      links: links,
      propertyLinks: propertyLinks,
      isProcessed: propertyLinks.length === 0, // Mark as processed if no property links
    });

    await processedEmail.save();

    // Enqueue scraping jobs for property links
    if (propertyLinks.length > 0) {
      for (const link of propertyLinks) {
        await this.scrapingQueue.add('scrape-property', {
          url: link,
          emailAccountId: emailAccount._id.toString(),
          emailId: processedEmail._id.toString(),
        }, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        });
      }

      // Mark email as processed
      processedEmail.isProcessed = true;
      processedEmail.processedAt = new Date();
      await processedEmail.save();

      logger.info(`Enqueued ${propertyLinks.length} property links from email ${message.attributes.uid}`);
    }
  }

  /**
   * Extract links from HTML/text content
   */
  _extractLinks(content) {
    const links = [];
    
    // Extract from HTML
    const htmlLinkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = htmlLinkRegex.exec(content)) !== null) {
      links.push(match[1]);
    }

    // Extract from plain text URLs
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
    while ((match = urlRegex.exec(content)) !== null) {
      links.push(match[1]);
    }

    // Remove duplicates and normalize
    return [...new Set(links.map(link => this._normalizeUrl(link)))];
  }

  /**
   * Normalize URL
   */
  _normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.href;
    } catch (error) {
      return url;
    }
  }

  /**
   * Filter property-related links using pattern matching
   */
  _filterPropertyLinks(links) {
    const propertyDomains = [
      '99acres.com',
      'magicbricks.com',
      'housing.com',
      'makaan.com',
      'commonfloor.com',
      'proptiger.com',
      'squareyards.com',
    ];

    const propertyKeywords = ['property', 'listing', 'rent', 'sale', 'apartment', 'house', 'bhk'];

    return links.filter(link => {
      const lowerLink = link.toLowerCase();
      
      // Check domain
      const matchesDomain = propertyDomains.some(domain => lowerLink.includes(domain));
      
      // Check keywords
      const matchesKeywords = propertyKeywords.some(keyword => lowerLink.includes(keyword));
      
      return matchesDomain || matchesKeywords;
    });
  }

  /**
   * Get all parts of email
   */
  _getParts(struct, allParts = []) {
    for (let part of struct) {
      if (part.disposition === undefined) {
        allParts.push(part);
      }
      if (part.parts) {
        this._getParts(part.parts, allParts);
      }
    }
    return allParts;
  }

  /**
   * Close connection for an account
   */
  async closeConnection(accountId) {
    const connection = this.connections.get(accountId);
    if (connection) {
      try {
        await connection.end();
        this.connections.delete(accountId);
        logger.info(`Closed IMAP connection for account ${accountId}`);
      } catch (error) {
        logger.error(`Error closing connection:`, error);
      }
    }
  }

  /**
   * Close all connections
   */
  async closeAllConnections() {
    for (const [accountId, connection] of this.connections.entries()) {
      await this.closeConnection(accountId);
    }
  }
}

module.exports = new EmailMonitorService();
