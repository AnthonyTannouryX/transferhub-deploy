import { apiClient } from './apiClient';

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  status: string;
}

export interface CashStatus {
  current_cash_balance: number;
  cash_currency: string;
  recommended_balance: number;
  needs_funding: boolean;
  can_process_cash_out: boolean;
  funding_suggestions: {
    self_funding: string;
    admin_funding: string;
    minimum_balance: string;
    recommended_balance: string;
  };
}

export interface FeeCalculation {
  transaction_amount: number;
  currency: string;
  transaction_type: string;
  customer_fee: number;
  agent_commission: number;
  system_revenue: number;
  total_cost_to_customer: number;
  fee_rate: number;
  commission_rate: number;
}

export interface TransactionResult {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  balance_after: number;
  created_at: string;
  transaction_reference: string;
  status: string;
  customer_name: string;
  customer_phone: string | null;
  cash_impact: number;
  cash_impact_label: string;
  wallet_impact: number;
  wallet_impact_label: string;
}

export class AgentService {
  // Get agent's cash status
  static async getCashStatus(): Promise<CashStatus> {
    const data = await apiClient.get('/agent/cash-status');
    return data.data;
  }

  // Get recent transactions
  static async getRecentTransactions(): Promise<TransactionResult[]> {
    const data = await apiClient.get('/agent/recent-transactions');
    return data.data || [];
  }

  // Get digital wallet balance
  static async getDigitalWalletBalance(): Promise<{ balance: number; currency: string }> {
    try {
      const data = await apiClient.get('/agent/digital-wallet-balance');
      
      if (!data) {
        return { balance: 0, currency: 'USD' };
      }
      
      return {
        balance: data.balance || 0,
        currency: data.currency || 'USD'
      };
    } catch (error) {
      console.error('Error fetching digital wallet balance:', error);
      return { balance: 0, currency: 'USD' };
    }
  }

  // Search customers
  static async searchCustomers(query: string, searchType: 'phone' | 'email'): Promise<Customer[]> {
    const data = await apiClient.post('/agent/search-customer', {
      query,
      search_type: searchType
    });
    return data;
  }

  // Get customer details
  static async getCustomerDetails(customerId: string): Promise<{ customer: Customer; wallet_balances: Record<string, number> }> {
    const data = await apiClient.get(`/agent/customer/${customerId}`);
    return data;
  }

  // Calculate fees
  static async calculateFees(amount: number, currency: string, transactionType: 'cash_in' | 'cash_out'): Promise<FeeCalculation> {
    console.log('📤 Sending calculateFees request:', { amount, currency, transactionType });
    
    const response: any = await apiClient.post('/agent/calculate-fees', {
      amount,
      currency,
      transaction_type: transactionType
    });
    
    console.log('📥 Received calculateFees full response:', response);
    console.log('📥 Response success:', response.success);
    console.log('📥 Response data:', response.data);
    
    // Return the data property from the response
    return response.data;
  }

  // Process cash-in
  static async processCashIn(customerPhone: string, amount: number, currency: string, description?: string): Promise<TransactionResult> {
    const data = await apiClient.post('/agent/process-cash-in', {
      customer_phone: customerPhone,
      amount,
      currency,
      description: description || 'Cash-in transaction'
    });
    return data;
  }

  // Process cash-out
  static async processCashOut(customerPhone: string, amount: number, currency: string, description?: string): Promise<TransactionResult> {
    const data = await apiClient.post('/agent/process-cash-out', {
      customer_phone: customerPhone,
      amount,
      currency,
      description: description || 'Cash-out transaction'
    });
    return data;
  }

  // Record initial cash
  static async recordInitialCash(amount: number, currency: string, description?: string): Promise<{
    amount_recorded: number;
    currency: string;
    description: string;
    agent_cash_balance: number;
    agent_digital_balance: number;
  }> {
    const data = await apiClient.post('/agent/record-initial-cash', {
      amount,
      currency,
      description: description || 'Initial cash deposit'
    });
    return data;
  }

  // Add cash to store
  static async addCash(amount: number, currency: string, description?: string): Promise<{
    amount_added: number;
    previous_balance: number;
    new_balance: number;
    currency: string;
  }> {
    const data = await apiClient.post('/agent/add-cash', {
      amount,
      currency,
      description: description || 'Cash deposit'
    });
    return data;
  }

  // Check cash availability
  static async checkCashAvailability(amount: number, currency: string): Promise<{
    requested_amount: number;
    available_cash: number;
    can_process: boolean;
    shortfall: number;
    message: string;
  }> {
    const data = await apiClient.post('/agent/check-cash-availability', {
      amount,
      currency
    });
    return data;
  }

  // Get dashboard data
  static async getDashboardData(): Promise<{
    stats: {
      today_cash_in: string;
      today_cash_out: string;
      today_transactions_count: number;
      commission_earned: string;
      digital_wallet_balance: string;
      cash_balance: string;
    };
    recent_transactions: Array<{
      id: number;
      amount: string;
      type: string;
      description: string;
      status: string;
      created_at: string;
      time_ago: string;
    }>;
    store_info: {
      name: string;
      location: string;
      working_hours: string;
      phone: string;
      email: string;
    };
    agent_info: {
      name: string;
      email: string;
      phone: string;
    };
  }> {
    const response = await apiClient.get('/agent/dashboard');
    return response.data;
  }

  // Get daily summary for a specific date
  static async getDailySummary(date: string): Promise<{
    date: string;
    stats: {
      today_cash_in: string;
      today_cash_out: string;
      today_transactions_count: number;
      commission_earned: string;
      digital_wallet_balance: string;
      cash_balance: string;
      cash_in_count: number;
      cash_out_count: number;
      total_fees: string;
      admin_fees: string;
      net_profit: string;
    };
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      currency: string;
      description: string;
      customer_name: string;
      customer_phone: string | null;
      created_at: string;
      time: string;
      cash_impact: number;
      cash_impact_label: string;
      wallet_impact: number;
      wallet_impact_label: string;
    }>;
    agent_info: {
      name: string;
      email: string;
      phone: string;
    };
  }> {
    const response = await apiClient.get('/agent/daily-summary', {
      params: { date }
    });
    return response.data;
  }

  // Update store schedule
  static async updateSchedule(schedule: Record<string, { isOpen: boolean; startTime: string; endTime: string }>): Promise<{
    success: boolean;
    message: string;
    data: {
      schedule: Record<string, { isOpen: boolean; startTime: string; endTime: string }>;
    };
  }> {
    const response = await apiClient.put('/agent/schedule', { schedule });
    return response;
  }

}
