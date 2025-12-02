import { API_CONFIG, AUTH_ENDPOINTS, STORAGE_KEYS } from '../config';

// Auth API service
export const authApi = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    // First, get CSRF cookie
    await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
    });

    const response = await fetch(`${API_CONFIG.BASE_URL}${AUTH_ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    return response.json();
  },

  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    // First, get CSRF cookie
    await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
    });

    const response = await fetch(`${API_CONFIG.BASE_URL}${AUTH_ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Extract specific error message from errors object
      let errorMessage = errorData.message || 'Login failed';

      if (errorData.errors && errorData.errors.email && errorData.errors.email.length > 0) {
        errorMessage = errorData.errors.email[0];
      }

      throw new Error(errorMessage);
    }

    return response.json();
  },

  // Logout user
  logout: async (): Promise<ApiResponse> => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${AUTH_ENDPOINTS.LOGOUT}`, {
      method: 'POST',
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Logout failed');
    }

    return response.json();
  },

  // Verify email
  verifyEmail: async (data: EmailVerificationData): Promise<ApiResponse> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${AUTH_ENDPOINTS.VERIFY_EMAIL}`, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Email verification failed');
    }

    return response.json();
  },

  // Resend verification email
  resendVerification: async (data: ResendVerificationData): Promise<ApiResponse> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${AUTH_ENDPOINTS.RESEND_VERIFICATION}`, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to resend verification email');
    }

    return response.json();
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordData): Promise<ApiResponse> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${AUTH_ENDPOINTS.FORGOT_PASSWORD}`, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send password reset email');
    }

    return response.json();
  },

  // Reset password
  resetPassword: async (data: ResetPasswordData): Promise<ApiResponse> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${AUTH_ENDPOINTS.RESET_PASSWORD}`, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Password reset failed');
    }

    return response.json();
  },

  // Get current user data - returns user directly from backend
  me: async (): Promise<{ success: boolean; user: User; message?: string; error?: string }> => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${AUTH_ENDPOINTS.ME}`, {
      method: 'GET',
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get user data');
    }

    return response.json();
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<ApiResponse> => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${AUTH_ENDPOINTS.BASE}/profile`, {
      method: 'PUT',
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile');
    }

    return response.json();
  },
};

// Auth utility functions
export const authUtils = {
  // Save auth data to localStorage
  saveAuthData: (token: string, user: User): void => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },

  // Get auth token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  // Get user data from localStorage
  getUserData: (): User | null => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  // Clear auth data from localStorage
  clearAuthData: (): void => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!authUtils.getToken();
  },
};

// Type definitions for auth data
export interface RegisterData {
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: 'personal' | 'agent';
  // Agent specific fields
  store_name?: string;
  address?: string;
  city?: string;
  country?: string;
  store_phone?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: any;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface EmailVerificationData {
  token: string;
}

export interface ResendVerificationData {
  email: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  password_confirmation: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: 'personal' | 'agent' | 'admin';
  status: 'pending' | 'active' | 'inactive';
  email_verified: boolean;
  admin_approved: boolean;
  subscription_status?: string;
  subscription_expires_at?: string;
  created_at?: string;
  updated_at?: string;
  agent_store?: AgentStore;
}

export interface AgentStore {
  id: string;
  user_id: string;
  store_name: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  status: string;
  opening_hours?: any;
  created_at?: string;
  updated_at?: string;
}
