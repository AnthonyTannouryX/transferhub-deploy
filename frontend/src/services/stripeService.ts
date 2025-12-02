import { apiClient } from './apiClient';

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  wallet_id: string;
  payment_method_id: string;
}

export interface PaymentIntentResponse {
  success: boolean;
  client_secret?: string;
  payment_intent_id?: string;
  message?: string;
}

export interface ConfirmPaymentRequest {
  payment_intent_id: string;
  wallet_id: string;
  payment_method_id?: string;
}

export interface SetupIntentResponse {
  success: boolean;
  client_secret?: string;
  setup_intent_id?: string;
  message?: string;
}

export interface AttachPaymentMethodRequest {
  payment_method_id: string;
}

export interface StripeTransaction {
  id: number;
  user_id: string;
  stripe_payment_intent_id: string;
  stripe_customer_id: string;
  stripe_payment_method_id: string;
  wallet_id: string;
  amount: number | string; // Can be number or string from database
  currency: string;
  status: string;
  description?: string;
  stripe_response?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
  wallet?: {
    id: string;
    currency: string;
    balance: number;
  };
}

export interface StripeTransactionResponse {
  success: boolean;
  data?: StripeTransaction[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
  message?: string;
}

class StripeService {
  /**
   * Create a payment intent for wallet top-up
   */
  async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      const response = await apiClient.post('/stripe/payment-intent', data);
      return response as PaymentIntentResponse;
    } catch (error: any) {
      console.error('Create payment intent failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create payment intent',
      };
    }
  }

  /**
   * Confirm payment and process wallet top-up
   */
  async confirmPayment(data: ConfirmPaymentRequest): Promise<any> {
    try {
      const response = await apiClient.post('/stripe/confirm-payment', data);
      return response;
    } catch (error: any) {
      console.error('Confirm payment failed:', error);
      throw error;
    }
  }

  /**
   * Create a setup intent for saving payment methods
   */
  async createSetupIntent(): Promise<SetupIntentResponse> {
    try {
      const response = await apiClient.post('/stripe/setup-intent');
      return response as SetupIntentResponse;
    } catch (error: any) {
      console.error('Create setup intent failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create setup intent',
      };
    }
  }

  /**
   * Attach payment method to user
   */
  async attachPaymentMethod(data: AttachPaymentMethodRequest): Promise<{ success: boolean; message?: string; payment_method?: any }> {
    try {
      const response = await apiClient.post('/stripe/attach-payment-method', data);
      return response as { success: boolean; message?: string; payment_method?: any };
    } catch (error: any) {
      console.error('Attach payment method failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to attach payment method',
      };
    }
  }

  /**
   * Get user's Stripe transaction history
   */
  async getTransactionHistory(limit: number = 20, offset: number = 0): Promise<StripeTransactionResponse> {
    try {
      const response = await apiClient.get('/stripe/transactions', {
        params: { limit, offset }
      });
      return response as StripeTransactionResponse;
    } catch (error: any) {
      console.error('Get transaction history failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch transaction history',
      };
    }
  }
}

export const stripeService = new StripeService();
