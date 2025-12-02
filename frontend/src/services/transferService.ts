import { apiClient } from './apiClient';

export interface CreateTransferRequest {
  beneficiary_id: string;
  amount: number;
  currency: string;
  speed_tier: 'standard' | 'express';
  description?: string;
}

export interface Transfer {
  id: string;
  transfer_reference: string;
  amount_sent: number | string;
  currency_sent: string;
  amount_received?: number | string;
  currency_received?: string;
  transfer_fee: number | string;
  total_cost: number | string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  speed_tier: 'standard' | 'express';
  created_at: string;
  completed_at?: string;
  beneficiary_name?: string;
  beneficiary_email?: string;
}

export interface CreateTransferResponse {
  success: boolean;
  message?: string;
  transfer?: Transfer;
  errors?: Record<string, string[]>;
}

class TransferService {
  /**
   * Create a new transfer
   */
  async createTransfer(data: CreateTransferRequest): Promise<CreateTransferResponse> {
    try {
      const response = await apiClient.post('/transfers', data);
      return response;
    } catch (error: any) {
      console.error('Create transfer failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create transfer',
        errors: error.response?.data?.errors
      };
    }
  }

  /**
   * Get user's transfer history
   */
  async getTransfers(): Promise<{ success: boolean; transfers?: Transfer[]; message?: string }> {
    try {
      const response = await apiClient.get('/transfers');
      return response;
    } catch (error: any) {
      console.error('Get transfers failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch transfers'
      };
    }
  }

  /**
   * Search for a specific transfer
   */
  async searchTransfer(query: string): Promise<{ success: boolean; transfer?: Transfer; message?: string }> {
    try {
      const response = await apiClient.get(`/transfers/search?q=${encodeURIComponent(query)}`);
      return response;
    } catch (error: any) {
      console.error('Search transfer failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search transfer'
      };
    }
  }

  /**
   * Get a specific transfer by ID
   */
  async getTransfer(id: string): Promise<{ success: boolean; transfer?: Transfer; message?: string }> {
    try {
      const response = await apiClient.get(`/transfers/${id}`);
      return response;
    } catch (error: any) {
      console.error('Get transfer failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get transfer'
      };
    }
  }

  /**
   * Calculate transfer fees
   */
  async calculateFees(amount: number, currency: string, speedTier: 'standard' | 'express'): Promise<any> {
    try {
      const response = await apiClient.post('/transfers/calculate-fees', {
        amount,
        currency,
        speed_tier: speedTier
      });
      return response;
    } catch (error: any) {
      console.error('Calculate fees failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to calculate fees'
      };
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<any> {
    try {
      const response = await apiClient.get('/transfers/dashboard');
      return response;
    } catch (error: any) {
      console.error('Get dashboard stats failed:', error);
      return {
        success: false,
        statistics: {
          total_transferred: 0,
          total_transfers: 0,
          completed_transfers: 0,
          pending_transfers: 0,
          processing_transfers: 0,
        },
        recent_transfers: []
      };
    }
  }
}

export const transferService = new TransferService();
