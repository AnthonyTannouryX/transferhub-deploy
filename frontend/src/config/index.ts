// API Configuration
export const API_CONFIG = {
  // Base API URL - can be overridden by environment variables
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

// Application URLs
export const APP_URLS = {
  FRONTEND: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:8080',
  ADMIN: import.meta.env.VITE_ADMIN_URL || 'http://localhost:8080/admin',
} as const;

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'transferhub_auth_token',
  USER_DATA: 'transferhub_user_data',
  REFRESH_TOKEN: 'transferhub_refresh_token',
} as const;

// Auth endpoints
export const AUTH_ENDPOINTS = {
  BASE: '/auth',
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  ME: '/auth/me',
} as const;

// Stripe configuration
export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: 'pk_test_51PmDkXHHV1iOFTShkdQnHH6aa4TN2JhccETGQtwgfBWuwhBdK1fOCAA7MMmClqEBYsvBGq4if2i93JjQbbl6FfpN00wE8ylGlS',
} as const;
