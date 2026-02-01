# Real Estate Email Automation Agent

## Overview
This project automates the process of monitoring real estate inquiries from emails. It scans for property links, extracting structured data (rent, BHK, size, etc.) using AI/Regex, and presents it in a Mobile Dashboard.

## Features
- **Multi-Mailbox Support**: Connects via IMAP to monitor emails.
- **Automated Scraping**: Uses Playwright to visit property links found in emails.
- **Intelligent Extraction**: Extracts structured fields using OpenAI (with Regex fallback).
- **Mobile Dashboard**: React Native Expo app to view daily summaries and listings.
- **Daily Reports**: Backend service to generate usage statistics.

## Tech Stack
- **Backend**: Node.js, Express, TypeScript, MongoDB.
- **Services**: `imap` (Email), `playwright` (Scraping), `openai` (AI).
- **Frontend**: React Native (Expo), TypeScript.

## Setup Instructions

### Prerequisites
- Node.js & npm/yarn
- MongoDB (running locally or URI)
- Playwright browsers (will install automatically)

### Backend
1. Navigate to backend: `cd backend`
2. Install dependencies: `npm install`
3. Configure `.env` in `src/.env` (or root `.env`):
   ```env
   MONGODB_URI=mongodb://localhost:27017/property-monitor
   OPENAI_API_KEY=your_key
   SMTP_USER=your_email
   SMTP_PASS=your_password
   ```
4. Start Server: `npm start` (Runs on port 3000)

### Frontend
1. Navigate to frontend: `cd frontend`
2. Install dependencies: `npm install`
3. Start Expo: `npx expo start`
4. Press `a` for Android, `i` for iOS simulator.

### Testing Manually
You can trigger a manual scan via API:
```bash
curl -X POST http://localhost:3000/api/properties/scan \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example-property-site.com/listing/123"}'
```

## Project Structure
- `backend/src/services`: Core logic (Email, Scraper, Extraction).
- `backend/src/models`: Database Schemas.
- `frontend/src/screens`: Mobile App UI.
