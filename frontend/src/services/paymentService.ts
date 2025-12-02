import { apiClient } from './apiClient';

export interface PaymentMethod {
  id: string;
  type: string;
  provider?: string;
  account_holder_name?: string;
  account_number?: string;
  card_expiry_month?: number;
  card_expiry_year?: number;
  is_default: boolean;
  created_at: string;
  stripe_payment_method_id?: string;
  // Computed/display fields
  card_brand?: string;
  last4?: string;
  bank_name?: string;
  expiry_month?: number;
  expiry_year?: number;
}

export interface PaymentMethodResponse {
  success: boolean;
  data?: PaymentMethod[];
  payment_methods?: PaymentMethod[];
  message?: string;
}

class PaymentService {
  /**
   * Get all payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethodResponse> {
    try {
      const response = await apiClient.get('/payment-methods') as PaymentMethodResponse;
      return response;
    } catch (error: any) {
      console.error('Get payment methods failed:', error);
      return {
        success: false,
        payment_methods: [],
        message: error.response?.data?.message || 'Failed to fetch payment methods'
      };
    }
  }

  /**
   * Add a new payment method
   */
  async addPaymentMethod(data: any): Promise<any> {
    try {
      const response = await apiClient.post('/payment-methods', data);
      return response;
    } catch (error: any) {
      console.error('Add payment method failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add payment method'
      };
    }
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(id: string): Promise<any> {
    try {
      const response = await apiClient.delete(`/payment-methods/${id}`);
      return response;
    } catch (error: any) {
      console.error('Delete payment method failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete payment method'
      };
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(id: string): Promise<any> {
    try {
      const response = await apiClient.post(`/payment-methods/${id}/set-default`);
      return response;
    } catch (error: any) {
      console.error('Set default payment method failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to set default payment method'
      };
    }
  }
}

export const paymentService = new PaymentService();
