import { apiClient } from './apiClient';

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price: number;
  monthly_limit: number | null;
  transfer_fee: number;
  express_fee: number;
  exchange_rate_type: string;
  features: string[];
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  plan: SubscriptionPlan;
}

export interface MonthlyUsage {
  current_usage: number;
  monthly_limit: number | null;
  usage_percentage: number;
  remaining_limit: number | null;
}

export interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  account_holder_name: string | null;
  last4: string | null;
  card_brand: string | null;
  card_expiry_month: number | null;
  card_expiry_year: number | null;
  is_default: boolean;
}

class SubscriptionService {
  /**
   * Get user's current subscription plan
   */
  async getCurrentPlan(): Promise<SubscriptionPlan | null> {
    try {
      const response = await apiClient.get('/subscription/current');
      return response.data?.plan || null;
    } catch (error) {
      console.error('Failed to fetch current plan:', error);
      return null;
    }
  }

  /**
   * Get user's monthly usage
   */
  async getMonthlyUsage(): Promise<MonthlyUsage> {
    try {
      const response = await apiClient.get('/subscription/usage');
      return response.data || {
        current_usage: 0,
        monthly_limit: null,
        usage_percentage: 0,
        remaining_limit: null
      };
    } catch (error) {
      console.error('Failed to fetch monthly usage:', error);
      return {
        current_usage: 0,
        monthly_limit: null,
        usage_percentage: 0,
        remaining_limit: null
      };
    }
  }

  /**
   * Get all available subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await apiClient.get('/subscription/plans');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      return [];
    }
  }

  /**
   * Get user's payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await apiClient.get('/subscription/payment-methods');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      return [];
    }
  }

  /**
   * Subscribe to a plan
   */
  async subscribe(planId: string): Promise<UserSubscription> {
    const response = await apiClient.post('/subscription/subscribe', {
      plan_id: planId
    });
    return response.data;
  }

  /**
   * Subscribe to a plan with payment
   */
  async subscribeWithPayment(planId: string, paymentMethodId: string): Promise<UserSubscription> {
    const response = await apiClient.post('/subscription/subscribe-with-payment', {
      plan_id: planId,
      payment_method_id: paymentMethodId
    });
    return response.data;
  }

  /**
   * Cancel current subscription
   */
  async cancel(): Promise<void> {
    await apiClient.post('/subscription/cancel');
  }
}

export const subscriptionService = new SubscriptionService();
