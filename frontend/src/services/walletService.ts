import { apiClient } from './apiClient';

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  is_active: boolean;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  currency_info?: {
    code: string;
    name: string;
    symbol: string;
    is_active: boolean;
  };
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out';
  amount: number | string;
  balance_after: number | string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WalletBalance {
  currency: string;
  balance: number;
}

export interface DepositRequest {
  currency: string;
  amount: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface WithdrawRequest {
  currency: string;
  amount: number;
  description?: string;
}

export interface TransferRequest {
  beneficiary_id: string;
  currency: string;
  amount: number;
  description?: string;
  is_express?: boolean;
}

export interface FeeCalculation {
  base_fee: number;
  express_fee: number;
  plan_discount: number;
  total_fee: number;
  fee_breakdown: {
    base_fee: number;
    express_fee: number;
    plan_discount: number;
    total_fee: number;
  };
}

class WalletService {
  /**
   * Get all user wallets
   */
  async getWallets(): Promise<Wallet[]> {
    try {
      const response = await apiClient.get('/wallet');
      
      // Fix: Use response.wallets instead of response.data
      const wallets = response.wallets || [];
      
      // Convert string balances to numbers and ensure all fields are properly typed
      const processedWallets = wallets.map((wallet: any) => {
        return {
          ...wallet,
          balance: parseFloat(wallet.balance) || 0,
          is_active: wallet.is_active ?? true,
          metadata: wallet.metadata || null,
          currency_info: wallet.currency_info || null
        };
      });
      
      return processedWallets;
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      return [];
    }
  }

  /**
   * Get wallet balance for specific currency
   */
  async getBalance(currency: string): Promise<WalletBalance> {
    const response = await apiClient.get('/wallet/balance', {
      params: { currency }
    });
    return response.data.data;
  }

  /**
   * Get wallet balance by wallet ID
   */
  async getWalletBalance(walletId: string): Promise<number> {
    try {
      const response = await apiClient.get(`/wallet/${walletId}/balance`);
      return response.data?.balance || 0;
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      return 0;
    }
  }

  /**
   * Deposit funds to wallet
   */
  async deposit(data: DepositRequest): Promise<WalletTransaction> {
    const response = await apiClient.post('/wallet/deposit', data);
    return response.data.data;
  }

  /**
   * Withdraw funds from wallet
   */
  async withdraw(data: WithdrawRequest): Promise<WalletTransaction> {
    const response = await apiClient.post('/wallet/withdraw', data);
    return response.data.data;
  }

  /**
   * Transfer funds to another user via wallet
   */
  async transfer(data: TransferRequest): Promise<WalletTransaction[]> {
    const response = await apiClient.post('/wallet/transfer', data);
    return response.data.data;
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(currency: string, amount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance(currency);
      return balance.balance >= amount;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get wallet transaction history
   */
  async getTransactions(walletId?: string, limit: number = 50): Promise<WalletTransaction[]> {
    try {
      const params: any = { limit };
      if (walletId) {
        params.wallet_id = walletId;
      }
      
      const response = await apiClient.get('/wallet/transactions', { params });
      
      // Fix: Use response.transactions instead of response.data
      const transactions = response.transactions || [];
      return transactions;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }
  }

  /**
   * Calculate transfer fees
   */
  async calculateFees(amount: number, currency: string, speedTier: string = 'standard'): Promise<FeeCalculation> {
    try {
      const response = await apiClient.post('/transfers/calculate-fees', {
        amount,
        currency,
        speed_tier: speedTier
      });
      
      return response.data || {
        base_fee: 0,
        express_fee: 0,
        plan_discount: 0,
        total_fee: 0,
        fee_breakdown: {
          base_fee: 0,
          express_fee: 0,
          plan_discount: 0,
          total_fee: 0,
        }
      };
    } catch (error) {
      console.error('Failed to calculate fees:', error);
      // Return default fee structure on error
      return {
        base_fee: 0,
        express_fee: 0,
        plan_discount: 0,
        total_fee: 0,
        fee_breakdown: {
          base_fee: 0,
          express_fee: 0,
          plan_discount: 0,
          total_fee: 0,
        }
      };
    }
  }

  /**
   * Get wallet summary for dashboard
   */
  async getWalletSummary(): Promise<{
    total_balance: number;
    wallets: Wallet[];
    recent_transactions: WalletTransaction[];
  }> {
    const [wallets, transactions] = await Promise.all([
      this.getWallets(),
      this.getTransactions(undefined, 10)
    ]);

    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

    return {
      total_balance: totalBalance,
      wallets,
      recent_transactions: transactions
    };
  }
}

export const walletService = new WalletService();
