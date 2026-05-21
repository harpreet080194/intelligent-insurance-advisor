import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse } from '@/types';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  verifyMFA: (code: string) => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      mfaRequired: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const response: any = await api.login(email, password);
          
          // Handle backend response: { success, message, data: { user, token, refreshToken } }
          const authData = response.data || response;
          
          if (authData.mfaRequired) {
            set({ mfaRequired: true, isLoading: false });
            toast.success('Please enter your MFA code');
            return;
          }

          const token = authData.token;
          const refreshToken = authData.refreshToken;
          const user = authData.user
            ? {
                userId: authData.user.user_id,
                email: authData.user.email,
                profile: authData.user.profile || { firstName: '', lastName: '' },
                preferences: authData.user.preferences || {
                  notifications: true,
                  emailUpdates: true,
                  theme: 'light',
                },
                mfaEnabled: Boolean(authData.user.mfa_enabled),
                createdAt: authData.user.created_at || '',
                updatedAt: authData.user.updated_at || '',
              }
            : null;

          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            mfaRequired: false,
          });
          
          toast.success('Login successful!');
          window.location.href = '/dashboard';
        } catch (error: any) {
          set({ isLoading: false });
          const backendMessage = error.response?.data?.error?.message || error.response?.data?.message;
          const requestUrl = error.config?.baseURL && error.config?.url
            ? `${error.config.baseURL}${error.config.url}`
            : error.config?.url;

          console.error('Login request failed:', {
            message: error.message,
            backendMessage,
            status: error.response?.status,
            requestUrl,
            responseData: error.response?.data,
          });

          toast.error(backendMessage || 'Login failed');
          throw error;
        }
      },

      register: async (data: any) => {
        try {
          set({ isLoading: true });
          const response: any = await api.register(data);
          
          // Handle the response structure: { success: true, data: { user, token } }
          const authData = response.data || response;
          
          localStorage.setItem('token', authData.token);
          if (authData.refreshToken) {
            localStorage.setItem('refreshToken', authData.refreshToken);
          }
          
          set({
            user: authData.user,
            token: authData.token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          toast.success('Registration successful!');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Registration failed');
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            mfaRequired: false,
          });
          toast.success('Logged out successfully');
        }
      },

      verifyMFA: async (code: string) => {
        try {
          set({ isLoading: true });
          const response: AuthResponse = await api.verifyMFA(code);
          
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            mfaRequired: false,
          });
          
          toast.success('MFA verification successful!');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'MFA verification failed');
          throw error;
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          mfaRequired: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Made with Bob
