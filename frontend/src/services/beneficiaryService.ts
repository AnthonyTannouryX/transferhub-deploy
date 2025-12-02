import { apiClient } from './apiClient';

export interface Beneficiary {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: string;
  status: string;
  payment_method: string;
  account_details: string;
  is_verified: boolean;
  is_favorite: boolean;
  last_transfer_date?: string;
  total_transfers: number;
  created_at: string;
  updated_at: string;
}

export interface BeneficiaryResponse {
  success: boolean;
  beneficiaries: Beneficiary[];
  message?: string;
}

export interface CreateBeneficiaryRequest {
  beneficiary_user_id: string;
  payment_method: 'bank' | 'wallet' | 'cash';
  account_details: string;
}

export interface CreateBeneficiaryResponse {
  success: boolean;
  message: string;
  beneficiary?: Beneficiary;
  errors?: any;
}

export interface UpdateBeneficiaryRequest {
  payment_method?: 'bank' | 'wallet' | 'cash';
  account_details?: string;
  is_favorite?: boolean;
}

class BeneficiaryService {
  /**
   * Get all beneficiaries for the current user
   */
  async getBeneficiaries(): Promise<BeneficiaryResponse> {
    try {
      const response = await apiClient.get('/beneficiaries');
      return response;
    } catch (error: any) {
      console.error('Get beneficiaries failed:', error);
      return {
        success: false,
        beneficiaries: [],
        message: error?.message || 'Failed to fetch beneficiaries'
      };
    }
  }

  /**
   * Add a user as beneficiary
   */
  async addBeneficiary(data: CreateBeneficiaryRequest): Promise<CreateBeneficiaryResponse> {
    try {
      const response = await apiClient.post('/beneficiaries', data);
      return response;
    } catch (error: any) {
      console.error('Add beneficiary failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add beneficiary',
        errors: error.response?.data?.errors
      };
    }
  }

  /**
   * Update beneficiary
   */
  async updateBeneficiary(id: string, data: UpdateBeneficiaryRequest): Promise<CreateBeneficiaryResponse> {
    try {
      const response = await apiClient.put(`/beneficiaries/${id}`, data);
      return response;
    } catch (error: any) {
      console.error('Update beneficiary failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update beneficiary',
        errors: error.response?.data?.errors
      };
    }
  }

  /**
   * Delete beneficiary
   */
  async deleteBeneficiary(id: string): Promise<CreateBeneficiaryResponse> {
    try {
      const response = await apiClient.delete(`/beneficiaries/${id}`);
      return response;
    } catch (error: any) {
      console.error('Delete beneficiary failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete beneficiary'
      };
    }
  }
}

export const beneficiaryService = new BeneficiaryService();
