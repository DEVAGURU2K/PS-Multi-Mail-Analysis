# System Flow Diagram

## End-to-End Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM INITIALIZATION                             │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  User adds email accounts via Frontend/API                                  │
│  - Email credentials stored (encrypted)                                     │
│  - IMAP configuration saved                                                │
│  - Account marked as active                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCHEDULER (Cron Job - Every 15-30 mins)                  │
│  - Triggers email monitoring for all active accounts                        │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EMAIL MONITORING SERVICE                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ For each active email account:                                       │  │
│  │  1. Connect to IMAP server                                           │  │
│  │  2. Fetch unread emails from INBOX and Sent Items                    │  │
│  │  3. Parse email content (HTML/Text)                                  │  │
│  │  4. Extract all links from email body                                │  │
│  │  5. Mark email as read/processed                                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LINK EXTRACTION & CLASSIFICATION                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ For each extracted link:                                             │  │
│  │  1. Check if link matches known property portal patterns             │  │
│  │  2. If ambiguous, use GenAI to classify:                             │  │
│  │     Prompt: "Is this a property listing URL? [URL]"                  │  │
│  │  3. Filter property-related links                                    │  │
│  │  4. Check if already processed (deduplication)                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    JOB QUEUE (BullMQ/Redis)                                  │
│  - Enqueue scraping job for each property link                              │
│  - Job contains: URL, email account ID, email ID                            │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WEB SCRAPER WORKER                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Pick job from queue                                               │  │
│  │ 2. Identify property portal (domain-based detection)                 │  │
│  │ 3. Load page with Playwright (headless browser)                      │  │
│  │ 4. Wait for dynamic content to load                                  │  │
│  │ 5. Extract raw HTML content                                          │  │
│  │ 6. Handle errors (timeout, blocked, CAPTCHA)                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GENAI DATA EXTRACTION SERVICE                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Send scraped HTML to GenAI API                                    │  │
│  │    Prompt: "Extract property details: BHK, unit type, size,          │  │
│  │             rent, address. Return JSON."                             │  │
│  │ 2. Receive structured JSON response                                  │  │
│  │ 3. Validate response format                                          │  │
│  │ 4. Fallback to rule-based extraction if API fails                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA VALIDATION & NORMALIZATION                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Validate data types (BHK is number, rent is number, etc.)        │  │
│  │ 2. Normalize formats:                                                 │  │
│  │    - "2 BHK" → 2                                                      │  │
│  │    - "₹50,000/month" → {value: 50000, currency: "INR", period: "month"}│
│  │    - "1500 sqft" → {value: 1500, unit: "sqft"}                       │  │
│  │ 3. Parse address components (city, state, pincode)                    │  │
│  │ 4. Geocode address (optional)                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEDUPLICATION CHECK                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Generate unique identifier: hash(URL + address)                  │  │
│  │ 2. Query database for existing listing with same identifier          │  │
│  │ 3. If duplicate:                                                     │  │
│  │    - Mark as duplicate                                               │  │
│  │    - Link to original listing                                        │  │
│  │    - Skip saving                                                     │  │
│  │ 4. If new: Continue to save                                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SAVE TO DATABASE (MongoDB)                                │
│  - PropertyListing document created                                        │
│  - Linked to EmailAccount and ProcessedEmail                               │
│  - Timestamped with createdAt and extractedAt                              │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DAILY REPORT GENERATION (Cron - Midnight)                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Query database for listings created in last 24 hours             │  │
│  │ 2. Filter out duplicates                                             │  │
│  │ 3. Group by email account (optional)                                 │  │
│  │ 4. Generate formatted report (HTML/PDF)                              │  │
│  │ 5. Send email to configured recipients                               │  │
│  │ 6. Save report metadata to database                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND DASHBOARD (React Native Expo)                   │
│  - View all property listings                                               │
│  - Filter by date, BHK, rent range, location                               │
│  - View daily reports                                                      │
│  - Manage email accounts                                                   │
│  - View processing status                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Component Interactions

### Email Monitoring Component
```
Email Monitor Service
    │
    ├── IMAP Connection Pool
    │   ├── Connection 1 (Account 1)
    │   ├── Connection 2 (Account 2)
    │   └── ... (up to 100+)
    │
    ├── Email Parser
    │   ├── HTML Parser (cheerio)
    │   ├── Text Parser
    │   └── Link Extractor
    │
    └── Link Classifier
        ├── Pattern Matching (regex)
        └── GenAI Classifier (fallback)
```

### Web Scraping Component
```
Scraper Worker Pool
    │
    ├── Worker 1
    │   ├── Playwright Browser Instance
    │   ├── Site Detector
    │   └── Site-Specific Scraper
    │
    ├── Worker 2
    │   └── (same structure)
    │
    └── Worker N (scalable)
        └── (same structure)
```

### GenAI Integration Points
```
GenAI Service
    │
    ├── Link Classification
    │   └── Input: URL → Output: {isPropertyListing: boolean}
    │
    ├── Data Extraction
    │   └── Input: HTML → Output: {bhk, unitType, size, rent, address}
    │
    ├── Selector Generation
    │   └── Input: HTML sample → Output: CSS selectors
    │
    └── Email Classification
        └── Input: Email content → Output: {isPropertyRelated: boolean, links: []}
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING STRATEGY                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
        ┌────────────────────┼────────────────────┐
        │                     │                    │
        ▼                     ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Email Error  │    │ Scrape Error │    │ GenAI Error  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Retry with   │    │ Retry (max 3)│    │ Fallback to  │
│ exponential  │    │ Mark failed  │    │ rule-based   │
│ backoff      │    │ if exceeds   │    │ extraction   │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Data Flow

```
Email → Parse → Links → Classify → Queue → Scrape → Extract → Validate → Dedupe → Store → Report
```

## State Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STATE TRACKING                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Email Status │    │ Job Status   │    │ Listing      │
│ - Unread     │    │ - Queued     │    │ Status       │
│ - Processing │    │ - Processing │    │ - New        │
│ - Processed  │    │ - Completed  │    │ - Duplicate  │
│ - Failed     │    │ - Failed     │    │ - Processed  │
└──────────────┘    └──────────────┘    └──────────────┘
```
