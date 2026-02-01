import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User, EmailAccount, PropertyListing, DailyReport, PropertyFilters, PaginatedResponse } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth APIs
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  // Email Account APIs
  async getEmailAccounts(): Promise<EmailAccount[]> {
    const response = await this.client.get<EmailAccount[]>('/email-accounts');
    return response.data;
  }

  async createEmailAccount(data: Partial<EmailAccount>): Promise<EmailAccount> {
    const response = await this.client.post<EmailAccount>('/email-accounts', data);
    return response.data;
  }

  async updateEmailAccount(id: string, data: Partial<EmailAccount>): Promise<EmailAccount> {
    const response = await this.client.put<EmailAccount>(`/email-accounts/${id}`, data);
    return response.data;
  }

  async deleteEmailAccount(id: string): Promise<void> {
    await this.client.delete(`/email-accounts/${id}`);
  }

  // Property APIs
  async getProperties(filters?: PropertyFilters): Promise<PaginatedResponse<PropertyListing>> {
    const response = await this.client.get<PaginatedResponse<PropertyListing>>('/properties', {
      params: filters,
    });
    return response.data;
  }

  async getPropertyById(id: string): Promise<PropertyListing> {
    const response = await this.client.get<PropertyListing>(`/properties/${id}`);
    return response.data;
  }

  // Report APIs
  async getReports(page?: number, limit?: number): Promise<PaginatedResponse<DailyReport>> {
    const response = await this.client.get<PaginatedResponse<DailyReport>>('/reports', {
      params: { page, limit },
    });
    return response.data;
  }

  async getReportByDate(date: string): Promise<DailyReport> {
    const response = await this.client.get<DailyReport>(`/reports/${date}`);
    return response.data;
  }

  async generateReport(date?: string): Promise<DailyReport> {
    const response = await this.client.post<DailyReport>('/reports/generate', { date });
    return response.data;
  }
}

export default new ApiService();
