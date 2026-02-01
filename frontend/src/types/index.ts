// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Email Account Types
export interface EmailAccount {
  _id: string;
  userId: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'custom';
  credentials: {
    password?: string;
    oauthToken?: string;
    refreshToken?: string;
  };
  imapConfig: {
    host: string;
    port: number;
    secure: boolean;
  };
  isActive: boolean;
  lastChecked: string | null;
  folders: string[];
  checkInterval: number;
  errorCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

// Property Listing Types
export interface PropertyListing {
  _id: string;
  sourceUrl: string;
  emailAccountId: string | EmailAccount;
  emailId: string;
  bhk?: number;
  unitType?: 'Apartment' | 'House' | 'Villa' | 'Studio' | 'Penthouse' | 'Other';
  size?: {
    value: number;
    unit: 'sqft' | 'sqm';
  };
  rent?: {
    value: number;
    currency: string;
    period: 'month' | 'year';
  };
  address: {
    full: string;
    city?: string;
    state?: string;
    pincode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  scrapedData: Record<string, any>;
  extractedAt: string;
  isDuplicate: boolean;
  duplicateOf?: string;
  uniqueIdentifier?: string;
  status: 'new' | 'processed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Daily Report Types
export interface DailyReport {
  _id: string;
  date: string;
  totalNewListings: number;
  listings: string[] | PropertyListing[];
  generatedAt: string;
  sentAt: string | null;
  recipients: string[];
  reportData: Record<string, any>;
  status: 'pending' | 'generated' | 'sent' | 'failed';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
  message?: string;
}

// Filter Types
export interface PropertyFilters {
  page?: number;
  limit?: number;
  bhk?: number;
  minRent?: number;
  maxRent?: number;
  city?: string;
  status?: 'new' | 'processed' | 'archived';
  emailAccountId?: string;
}
