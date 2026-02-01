# System Flow Diagram

```mermaid
graph TD
    User[User/Agent] -->|Configures| Config[.env / Mailboxes]
    
    subgraph "Email Source"
        MailServer[IMAP Server (Gmail/Outlook)]
    end

    subgraph "Backend System"
        EmailSvc[EmailMonitorService]
        Scraper[ScraperService (Playwright)]
        Extractor[DataExtractionService (AI + Regex)]
        DB[(MongoDB)]
        API[Express API]
        Report[ReportGeneratorService]
    end

    subgraph "Frontend App"
        Mobile[React Native App]
    end

    MailServer -->|New Email| EmailSvc
    EmailSvc -->|Extract Link| Scraper
    Scraper -->|HTML/Text| Extractor
    Extractor -->|Structured JSON| DB
    
    Mobile -->|GET /stats| API
    Mobile -->|GET /properties| API
    API -->|Query| DB
    Report -->|Daily Summary| DB
```
