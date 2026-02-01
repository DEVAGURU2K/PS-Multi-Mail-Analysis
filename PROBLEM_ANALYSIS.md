# Property Email Monitoring System - Problem Analysis

## Problem Overview

Build an automated system to monitor 100+ email accounts, extract property-related inquiries, scrape property listing details, and generate daily summary reports.

## Core Requirements Breakdown

### 1. Multi-Mailbox Monitoring (100+ Accounts)
**Challenge**: Monitor both Inbox and Sent Items for multiple email accounts simultaneously.

**Technical Considerations**:
- Email protocol: IMAP (preferred) or POP3 for reading emails
- Authentication: OAuth 2.0 for Gmail, App Passwords for other providers
- Rate limiting: Respect email provider limits (Gmail: 2500 quota units/day)
- Concurrent processing: Use worker queues (Bull/BullMQ) for parallel email processing
- Connection pooling: Manage multiple IMAP connections efficiently
- Error handling: Handle network failures, authentication errors, quota exhaustion

**Implementation Approach**:
- Use `node-imap` or `imap-simple` library for IMAP connections
- Implement connection pooling with retry logic
- Use Redis-based job queue (BullMQ) for distributed processing
- Store email credentials securely (encrypted in MongoDB)

### 2. Property Link Detection
**Challenge**: Identify property-related links in email bodies (HTML/text).

**Technical Considerations**:
- Email parsing: Parse HTML and plain text email bodies
- Link extraction: Extract all URLs from email content
- Pattern matching: Identify property listing URLs (domain-based filtering)
- GenAI Integration: Use free GenAI (Claude API free tier, OpenAI API, or local models) to:
  - Classify if email is property-related
  - Extract property links even from shortened URLs
  - Handle ambiguous links

**Implementation Approach**:
- Use `cheerio` or `jsdom` for HTML parsing
- Regex patterns for common property listing domains (99acres, magicbricks, housing.com, etc.)
- GenAI prompt: "Extract all property listing URLs from this email content: [email_body]"
- Cache results to avoid redundant API calls

### 3. Automated Web Scraping
**Challenge**: Scrape property details from various listing websites.

**Technical Considerations**:
- Tool selection: Playwright (recommended) - better than Selenium for Node.js
- Anti-bot measures: Handle CAPTCHAs, rate limiting, dynamic content
- Multiple sites: Different selectors for different property portals
- Headless browsing: Use headless mode for efficiency
- Error handling: Handle site structure changes, timeouts, blocked requests

**Implementation Approach**:
- Use Playwright with multiple browser contexts
- Implement site-specific scrapers (adapter pattern)
- Use GenAI to:
  - Generate/extract CSS selectors dynamically
  - Handle variations in page structure
  - Extract data from unstructured pages
- Implement retry logic with exponential backoff
- Cache scraped data to avoid re-scraping

### 4. Data Extraction & Structuring
**Challenge**: Extract structured data (BHK, unit type, size, rent, address) from scraped content.

**Technical Considerations**:
- Data normalization: Standardize formats (e.g., "2 BHK" vs "2BHK" vs "2 Bedroom")
- Address parsing: Extract and normalize addresses
- Price parsing: Handle different currencies and formats
- Missing data: Handle incomplete listings

**Implementation Approach**:
- Use GenAI for intelligent extraction:
  - Prompt: "Extract structured property data: BHK, unit type, size, rent, address from: [scraped_content]"
  - Return JSON format
- Post-process with regex/validation for data quality
- Store in MongoDB with schema validation

### 5. Daily Summary Reports
**Challenge**: Generate and deliver daily reports of newly found listings.

**Technical Considerations**:
- Deduplication: Avoid reporting same property multiple times
- Report format: PDF, HTML, or email
- Delivery: Email, dashboard, or API endpoint
- Scheduling: Use cron jobs or scheduled tasks

**Implementation Approach**:
- Track processed properties with unique identifiers (URL hash + address)
- Generate reports using templates (Handlebars/EJS)
- Schedule with `node-cron` or BullMQ scheduled jobs
- Send via email or expose via API

## Architecture Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React Native Expo)              │
│  - Dashboard for viewing reports                            │
│  - Email account management                                  │
│  - Property listings view                                    │
│  - Report generation UI                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────┴──────────────────────────────────────┐
│              Backend API (Node.js/Express)                  │
│  - Authentication & Authorization                            │
│  - Email account CRUD                                        │
│  - Report generation endpoints                               │
│  - Property listing endpoints                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│            Background Workers (Node.js)                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Email Monitor Service                              │    │
│  │  - IMAP connection management                       │    │
│  │  - Email polling (every 15-30 mins)                │    │
│  │  - Link extraction                                  │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Web Scraper Service                                │    │
│  │  - Playwright browser instances                     │    │
│  │  - Site-specific scrapers                           │    │
│  │  - Data extraction                                 │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  GenAI Service                                      │    │
│  │  - Link classification                              │    │
│  │  - Data extraction                                  │    │
│  │  - Selector generation                             │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Report Generator Service                           │    │
│  │  - Daily report generation                          │    │
│  │  - Deduplication                                   │    │
│  │  - Email sending                                   │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                    Job Queue (Redis/BullMQ)                  │
│  - Email processing jobs                                     │
│  - Scraping jobs                                            │
│  - Report generation jobs                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                    Database (MongoDB)                        │
│  - Email accounts                                            │
│  - Processed emails                                          │
│  - Property listings                                         │
│  - Reports                                                   │
│  - User management                                           │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend**:
- Runtime: Node.js (v18+)
- Framework: Express.js
- Database: MongoDB with Mongoose ODM
- Job Queue: BullMQ with Redis
- Web Scraping: Playwright
- Email: node-imap, nodemailer
- GenAI: OpenAI API / Anthropic Claude API / Hugging Face API
- Authentication: JWT, bcrypt
- Validation: Joi or Zod
- Logging: Winston or Pino

**Frontend**:
- Framework: React Native with Expo
- State Management: Redux Toolkit or Zustand
- Navigation: React Navigation
- HTTP Client: Axios
- UI Components: React Native Paper or NativeBase

**Infrastructure**:
- Redis: For job queue and caching
- Docker: For containerization (optional)
- PM2: For process management

## Data Models

### EmailAccount Schema
```javascript
{
  userId: ObjectId,
  email: String (unique),
  provider: String, // 'gmail', 'outlook', 'yahoo', etc.
  credentials: {
    // Encrypted credentials
    password: String, // Encrypted
    oauthToken: String, // For OAuth providers
  },
  imapConfig: {
    host: String,
    port: Number,
    secure: Boolean
  },
  isActive: Boolean,
  lastChecked: Date,
  folders: [String], // ['INBOX', 'Sent Items']
  createdAt: Date,
  updatedAt: Date
}
```

### ProcessedEmail Schema
```javascript
{
  emailAccountId: ObjectId,
  messageId: String (unique),
  subject: String,
  from: String,
  to: String,
  date: Date,
  body: String,
  links: [String],
  propertyLinks: [String],
  isProcessed: Boolean,
  processedAt: Date,
  createdAt: Date
}
```

### PropertyListing Schema
```javascript
{
  sourceUrl: String (unique),
  emailAccountId: ObjectId,
  emailId: ObjectId,
  bhk: Number,
  unitType: String, // 'Apartment', 'House', 'Villa', etc.
  size: {
    value: Number,
    unit: String // 'sqft', 'sqm'
  },
  rent: {
    value: Number,
    currency: String, // 'INR', 'USD'
    period: String // 'month', 'year'
  },
  address: {
    full: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  scrapedData: Object, // Raw scraped content
  extractedAt: Date,
  isDuplicate: Boolean,
  duplicateOf: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### DailyReport Schema
```javascript
{
  date: Date (unique),
  totalNewListings: Number,
  listings: [ObjectId], // References to PropertyListing
  generatedAt: Date,
  sentAt: Date,
  recipients: [String] // Email addresses
}
```

## Implementation Flow

### Email Monitoring Flow
1. **Scheduler** triggers email check (every 15-30 minutes)
2. **Email Monitor Service** fetches unread emails from all active accounts
3. **Email Parser** extracts body content and links
4. **Link Classifier** (GenAI) identifies property-related links
5. **Job Queue** enqueues scraping jobs for property links
6. **Email marked as processed** in database

### Web Scraping Flow
1. **Worker** picks up scraping job from queue
2. **Site Detector** identifies property portal (99acres, magicbricks, etc.)
3. **Scraper** loads page with Playwright
4. **Content Extractor** extracts raw HTML/text
5. **GenAI Service** extracts structured data
6. **Data Validator** validates and normalizes data
7. **Deduplication Check** compares with existing listings
8. **Save to Database** if new listing

### Report Generation Flow
1. **Daily Cron Job** triggers at midnight
2. **Query Database** for listings created in last 24 hours
3. **Deduplication** removes duplicates
4. **Report Generator** creates formatted report
5. **Email Sender** sends report to configured recipients
6. **Save Report** metadata to database

## GenAI Integration Strategy

### Use Cases for GenAI

1. **Link Classification**
   - Prompt: "Classify if this URL is a property listing: [URL]. Respond with JSON: {isPropertyListing: boolean, confidence: number, reason: string}"
   - Use free tier APIs with rate limiting

2. **Data Extraction**
   - Prompt: "Extract property details from this HTML content: [content]. Return JSON with fields: bhk, unitType, size, rent, address"
   - Post-process to validate and normalize

3. **Selector Generation**
   - Prompt: "Generate CSS selectors to extract property details from this HTML structure: [sample HTML]"
   - Use for dynamic scraper configuration

4. **Email Classification**
   - Prompt: "Is this email about property inquiries? [email content]. Respond: {isPropertyRelated: boolean, propertyLinks: [string]}"

### GenAI Service Implementation
- Use OpenAI API (free tier: $5 credit) or Anthropic Claude (free tier available)
- Implement caching to reduce API calls
- Batch requests when possible
- Handle rate limits gracefully
- Fallback to rule-based extraction if API fails

## Security Considerations

1. **Email Credentials**: Encrypt at rest using AES-256
2. **API Keys**: Store in environment variables, never commit
3. **Rate Limiting**: Implement on API endpoints
4. **Authentication**: JWT tokens with refresh mechanism
5. **Input Validation**: Validate all user inputs
6. **SQL Injection**: Use parameterized queries (MongoDB handles this)
7. **XSS**: Sanitize email content before display

## Scalability Considerations

1. **Horizontal Scaling**: Use Redis for distributed job queue
2. **Connection Pooling**: Limit concurrent IMAP connections
3. **Caching**: Cache GenAI responses and scraped data
4. **Database Indexing**: Index frequently queried fields
5. **Load Balancing**: Use PM2 cluster mode or multiple instances

## Error Handling Strategy

1. **Email Connection Failures**: Retry with exponential backoff
2. **Scraping Failures**: Log error, mark for retry, skip after 3 attempts
3. **GenAI API Failures**: Fallback to rule-based extraction
4. **Database Errors**: Retry with connection pooling
5. **Rate Limiting**: Queue jobs and process when quota resets

## Testing Strategy

1. **Unit Tests**: Test individual services (email parser, scraper, extractor)
2. **Integration Tests**: Test email → scraping → storage flow
3. **E2E Tests**: Test complete workflow with mock email server
4. **Load Tests**: Test with 100+ email accounts simulation

## Deployment Considerations

1. **Environment Variables**: Separate dev/staging/prod configs
2. **Logging**: Centralized logging (Winston with file/console transports)
3. **Monitoring**: Health check endpoints, error tracking (Sentry)
4. **Backup**: Regular MongoDB backups
5. **CI/CD**: Automated testing and deployment pipeline
