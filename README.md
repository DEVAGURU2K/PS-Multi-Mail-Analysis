# Property Email Monitoring System

A comprehensive system for monitoring multiple email accounts, extracting property-related inquiries, scraping property listing details, and generating daily summary reports.

## Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Job Queue**: BullMQ with Redis
- **Web Scraping**: Playwright
- **Email**: IMAP (imap-simple), MailParser
- **GenAI**: OpenAI API / Anthropic Claude API
- **Authentication**: JWT, bcryptjs
- **Validation**: Joi
- **Logging**: Winston

### Frontend
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **UI Components**: React Native Paper
- **HTTP Client**: Axios
- **Storage**: AsyncStorage

## Project Structure

```
.
├── backend/                 # Node.js/Express backend (TypeScript)
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   ├── workers/         # Background job workers
│   │   ├── schedulers/     # Cron job schedulers
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                # React Native Expo frontend (TypeScript)
│   ├── src/
│   │   ├── screens/        # Screen components
│   │   ├── components/     # Reusable components
│   │   ├── navigation/     # Navigation configuration
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── App.tsx
│   └── package.json
│
├── PROBLEM_ANALYSIS.md     # Detailed problem analysis
├── FLOW_DIAGRAM.md         # System flow diagrams
└── README.md               # This file
```

## Features

### Core Capabilities

1. **Multi-Mailbox Monitoring**
   - Monitor 100+ email accounts simultaneously
   - Support for Gmail, Outlook, Yahoo, and custom IMAP servers
   - Monitor both Inbox and Sent Items folders
   - Configurable check intervals per account

2. **Property Link Detection**
   - Automatic extraction of links from email bodies
   - GenAI-powered classification of property-related links
   - Pattern matching fallback for reliability

3. **Automated Web Scraping**
   - Playwright-based web scraping
   - Support for multiple property portals
   - Dynamic content handling
   - Error handling and retry logic

4. **Data Extraction & Structuring**
   - GenAI-powered extraction of structured data:
     - BHK (bedroom count)
     - Unit type (Apartment, House, Villa, etc.)
     - Size (sqft/sqm)
     - Rent amount and period
     - Address details
   - Data validation and normalization
   - Deduplication using unique identifiers

5. **Daily Summary Reports**
   - Automated daily report generation
   - Email delivery to configured recipients
   - Filtering and grouping of new listings
   - Report history tracking

## Setup Instructions

### Prerequisites

- Node.js v18 or higher
- MongoDB (local or cloud instance)
- Redis (local or cloud instance)
- Expo CLI (for frontend)
- GenAI API key (OpenAI or Anthropic)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
   - MongoDB connection string
   - Redis connection details
   - JWT secret
   - Encryption key (32+ characters)
   - GenAI API key (OpenAI or Anthropic)
   - Email SMTP configuration

5. Build TypeScript:
```bash
npm run build
```

6. Start development server:
```bash
npm run dev
```

7. Start production server:
```bash
npm start
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
echo "EXPO_PUBLIC_API_URL=http://localhost:3000/api" > .env
```

4. Start Expo development server:
```bash
npm start
```

5. Run on specific platform:
```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

## GenAI Integration

### How GenAI is Used

1. **Link Classification**
   - Prompt: "Is this URL a property listing?"
   - Returns: JSON with classification result and confidence score
   - Fallback: Pattern matching if API fails

2. **Data Extraction**
   - Prompt: "Extract property details from HTML content"
   - Returns: Structured JSON with BHK, unit type, size, rent, address
   - Post-processing: Validation and normalization

3. **Email Classification**
   - Prompt: "Is this email about property inquiries?"
   - Returns: Classification result and extracted property links

4. **Selector Generation** (Future enhancement)
   - Prompt: "Generate CSS selectors for property data extraction"
   - Returns: CSS selectors for site-specific scraping

### GenAI Service Implementation

The GenAI service (`backend/src/services/genaiService.ts`) provides:
- Support for both OpenAI and Anthropic Claude APIs
- Automatic fallback to rule-based extraction
- Response validation and error handling
- Caching support (to be implemented)

### Corrections and Improvements Applied

1. **Error Handling**
   - Added comprehensive try-catch blocks
   - Implemented fallback mechanisms for API failures
   - Added retry logic with exponential backoff

2. **Data Validation**
   - Type checking for extracted data
   - Normalization of formats (BHK, rent, size)
   - Address parsing and validation

3. **Performance Optimization**
   - Implemented job queue for parallel processing
   - Added connection pooling for IMAP
   - Caching strategy for GenAI responses

4. **Security**
   - Encryption for email credentials
   - JWT authentication
   - Input validation and sanitization

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Email Accounts
- `GET /api/email-accounts` - Get all email accounts
- `POST /api/email-accounts` - Create email account
- `PUT /api/email-accounts/:id` - Update email account
- `DELETE /api/email-accounts/:id` - Delete email account

### Properties
- `GET /api/properties` - Get properties with filters
- `GET /api/properties/:id` - Get property by ID

### Reports
- `GET /api/reports` - Get all reports
- `GET /api/reports/:date` - Get report by date
- `POST /api/reports/generate` - Generate report manually

### Health
- `GET /api/health` - Health check endpoint

## Workflow

### Email Monitoring Flow

1. **Scheduler** triggers email check (every 15-30 minutes)
2. **Email Monitor Service** connects to IMAP and fetches unread emails
3. **Email Parser** extracts body content and links
4. **Link Classifier** (GenAI) identifies property-related links
5. **Job Queue** enqueues scraping jobs for property links
6. **Email marked as processed** in database

### Web Scraping Flow

1. **Worker** picks up scraping job from queue
2. **Site Detector** identifies property portal
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

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment Considerations

1. **Environment Variables**: Ensure all environment variables are set
2. **Database**: Set up MongoDB Atlas or self-hosted MongoDB
3. **Redis**: Set up Redis Cloud or self-hosted Redis
4. **Process Management**: Use PM2 for Node.js processes
5. **Logging**: Configure centralized logging
6. **Monitoring**: Set up health checks and monitoring
7. **Backup**: Regular MongoDB backups
8. **Security**: Use HTTPS, secure API keys, rate limiting

## Future Enhancements

1. **Real-time Updates**: WebSocket support for live updates
2. **Advanced Filtering**: More sophisticated property filters
3. **Map Integration**: Display properties on map
4. **Notifications**: Push notifications for new listings
5. **Analytics Dashboard**: Property trends and statistics
6. **Multi-language Support**: Support for multiple languages
7. **Export Functionality**: Export reports to PDF/Excel
8. **Machine Learning**: ML-based duplicate detection

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Failed**
   - Check MongoDB is running
   - Verify connection string in `.env`
   - Check network connectivity

2. **Redis Connection Failed**
   - Check Redis is running
   - Verify Redis configuration in `.env`
   - Check firewall settings

3. **GenAI API Errors**
   - Verify API key is correct
   - Check API quota/limits
   - Review error logs

### Frontend Issues

1. **Cannot Connect to API**
   - Verify `EXPO_PUBLIC_API_URL` in `.env`
   - Check backend server is running
   - Verify CORS settings

2. **Authentication Issues**
   - Check token storage
   - Verify JWT secret matches backend
   - Clear AsyncStorage and re-login

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

ISC

## Contact

For questions or support, please open an issue in the repository.
