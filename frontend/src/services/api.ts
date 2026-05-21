import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiService {
  private api: AxiosInstance;
  private isRedirecting = false;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<any>) => {
        if (error.response?.status === 401) {
          // Prevent multiple redirects
          if (!this.isRedirecting && window.location.pathname !== '/login') {
            this.isRedirecting = true;
            const message = error.response?.data?.message || 'Session expired';
            
            // Clear all auth data
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('auth-storage');
            
            toast.error(`${message}. Please login again.`);
            
            // Redirect after a short delay to ensure storage is cleared
            setTimeout(() => {
              window.location.href = '/login';
              this.isRedirecting = false;
            }, 100);
          }
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to perform this action.');
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: any) {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  async refreshToken() {
    const response = await this.api.post('/auth/refresh');
    return response.data;
  }

  async verifyMFA(code: string) {
    const response = await this.api.post('/auth/mfa/verify', { code });
    return response.data;
  }

  // User endpoints
  async getCurrentUser() {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.api.put('/users/profile', data);
    return response.data;
  }

  async updatePreferences(data: any) {
    const response = await this.api.put('/users/preferences', data);
    return response.data;
  }

  // Policy endpoints
  async getPolicies(params?: any) {
    const response = await this.api.get('/policies', { params });
    return response.data;
  }

  async getPolicy(policyId: string) {
    const response = await this.api.get(`/policies/${policyId}`);
    return response.data;
  }

  async getPolicyRecommendations(params?: any) {
    const response = await this.api.get('/policies/recommendations/personalized', { params });
    return response.data;
  }

  async createPolicy(data: any) {
    const response = await this.api.post('/policies', data);
    return response.data;
  }

  async updatePolicy(policyId: string, data: any) {
    const response = await this.api.patch(`/policies/${policyId}/status`, data);
    return response.data;
  }

  async cancelPolicy(policyId: string) {
    const response = await this.api.patch(`/policies/${policyId}/status`, { status: 'CANCELLED' });
    return response.data;
  }

  // Claim endpoints
  async getClaims(params?: any) {
    const response = await this.api.get('/claims', { params });
    return response.data;
  }

  async getClaim(claimId: string) {
    const response = await this.api.get(`/claims/${claimId}`);
    return response.data;
  }

  async submitClaim(data: FormData) {
    const response = await this.api.post('/claims', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateClaim(claimId: string, data: any) {
    const response = await this.api.put(`/claims/${claimId}`, data);
    return response.data;
  }

  async uploadClaimDocument(claimId: string, file: File) {
    const formData = new FormData();
    formData.append('document', file);
    const response = await this.api.post(`/claims/${claimId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Payment endpoints
  async getPayments(params?: any) {
    const response = await this.api.get('/payments', { params });
    return response.data;
  }

  async getPayment(paymentId: string) {
    const response = await this.api.get(`/payments/${paymentId}`);
    return response.data;
  }

  async processPayment(data: any) {
    const response = await this.api.post('/payments', data);
    return response.data;
  }

  async getPaymentMethods() {
    const response = await this.api.get('/payments/methods/list');
    return response.data;
  }

  async addPaymentMethod(data: any) {
    const response = await this.api.post('/payments/methods', data);
    return response.data;
  }

  async deletePaymentMethod(methodId: string) {
    const response = await this.api.delete(`/payments/methods/${methodId}`);
    return response.data;
  }

  // Chat endpoints
  async sendMessage(data: any) {
    const response = await this.api.post(`/chat/sessions/${data.sessionId}/messages`, {
      message: data.message,
    });
    return response.data;
  }

  async getChatHistory(sessionId?: string) {
    const response = await this.api.get(`/chat/sessions/${sessionId}`);
    return response.data;
  }

  async createChatSession() {
    const response = await this.api.post('/chat/sessions');
    return response.data;
  }

  async endChatSession(sessionId: string) {
    const response = await this.api.patch(`/chat/sessions/${sessionId}/end`);
    return response.data;
  }

  // Notification endpoints
  async getNotifications() {
    const response = await this.api.get('/notifications');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string) {
    const response = await this.api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.api.put('/notifications/read-all');
    return response.data;
  }
}

export default new ApiService();

// Made with Bob
