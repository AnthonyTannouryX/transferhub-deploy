import { apiClient } from './apiClient';

export interface AdminTransfer {
  id: string;
  transfer_reference: string;
  sender_name: string;
  sender_email: string;
  recipient_name: string;
  recipient_email: string;
  amount_sent: number | string;
  amount_received: number | string;
  currency_sent: string;
  currency_received: string;
  transfer_fee: number | string;
  status: string;
  speed_tier: string;
  created_at: string;
  completed_at?: string;
}

export interface AdminDashboard {
  admin: {
    id: string;
    name: string;
    email: string;
    user_type: string;
  };
  wallets: Array<{
    id: string;
    currency: string;
    balance: number;
    formatted_balance: string;
    is_active: boolean;
    currency_info: any;
  }>;
  statistics: {
    total_fees_collected: number;
    total_transfers: number;
    completed_transfers: number;
    pending_transfers: number;
    processing_transfers: number;
    total_volume: number;
    speed_tier_breakdown: Record<string, number>;
  };
  speed_tier_info: Record<string, {
    processing_time: number;
    description: string;
  }>;
  recent_fees: Array<{
    id: string;
    transaction_reference: string;
    amount: number;
    currency: string;
    description: string;
    created_at: string;
    metadata: any;
  }>;
}

export interface AdminWalletTransaction {
  id: string;
  transaction_reference: string;
  type: string;
  amount: number;
  formatted_amount: string;
  balance_before: number;
  balance_after: number;
  description: string;
  currency: string;
  status_color: string;
  created_at: string;
  metadata: any;
}

export interface UpdateTransferStatusRequest {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  notes?: string;
}

export interface UpdateTransferStatusResponse {
  success: boolean;
  message: string;
  transfer: {
    id: string;
    transfer_reference: string;
    status: string;
    completed_at?: string;
  };
}

export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  user_type: string;
}

export interface AdminAgent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  admin_approved: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  store?: {
    id: string;
    store_name: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    opening_hours?: any;
    status: string;
    created_at: string;
  };
}

export interface AdminUsersResponse {
  success: boolean;
  users: AdminUser[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  statistics: {
    total: number;
    active: number;
    suspended: number;
    pending: number;
    verified: number;
    unverified: number;
  };
}

export class AdminService {
  /**
   * Get admin dashboard data
   */
  static async getDashboard(): Promise<AdminDashboard> {
    console.log('🔍 AdminService: Getting dashboard data...');
    try {
      const response = await apiClient.get('/admin/dashboard');
      console.log('✅ AdminService: Dashboard data received:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to get dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get all transfers for admin management
   */
  static async getTransfers(): Promise<{
    success: boolean;
    transfers: AdminTransfer[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    console.log('🔍 AdminService: Getting transfers...');
    try {
      const response = await apiClient.get('/admin/transfers');
      console.log('✅ AdminService: Transfers received:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to get transfers:', error);
      throw error;
    }
  }

  /**
   * Update transfer status
   */
  static async updateTransferStatus(
    transferId: string, 
    data: UpdateTransferStatusRequest
  ): Promise<UpdateTransferStatusResponse> {
    console.log('🔍 AdminService: Updating transfer status:', { transferId, data });
    try {
      const response = await apiClient.put(`/admin/transfers/${transferId}/status`, data);
      console.log('✅ AdminService: Transfer status updated:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to update transfer status:', error);
      throw error;
    }
  }

  /**
   * Get admin wallet transactions
   */
  static async getWalletTransactions(): Promise<{
    success: boolean;
    transactions: AdminWalletTransaction[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    console.log('🔍 AdminService: Getting wallet transactions...');
    try {
      const response = await apiClient.get('/admin/wallet-transactions');
      console.log('✅ AdminService: Wallet transactions received:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to get wallet transactions:', error);
      throw error;
    }
  }

  /**
   * Get processing configuration
   */
  static async getConfig(): Promise<{
    success: boolean;
    config: {
      transfer_processing_mode: string;
      automated_processing: any;
      manual_processing: any;
      wallet_processing: any;
      status_transitions: any;
      admin_dashboard: any;
    };
  }> {
    const response = await apiClient.get('/admin/config');
    return response as any;
  }

  /**
   * Update processing configuration
   */
  static async updateConfig(config: any): Promise<{
    success: boolean;
    message: string;
    config: any;
  }> {
    const response = await apiClient.put('/admin/config', config);
    return response as any;
  }

  /**
   * Get processing mode options
   */
  static async getProcessingModes(): Promise<{
    success: boolean;
    modes: Array<{
      value: string;
      label: string;
      description: string;
      features: string[];
    }>;
  }> {
    const response = await apiClient.get('/admin/processing-modes');
    return response as any;
  }

  /**
   * Get personal users for admin management
   */
  static async getUsers(params?: {
    search?: string;
    status?: string;
    verification?: string;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
  }): Promise<AdminUsersResponse> {
    console.log('🔍 AdminService: Getting users...', params);
    try {
      const response = await apiClient.get('/admin/users', { params });
      console.log('✅ AdminService: Users received:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to get users:', error);
      throw error;
    }
  }

  /**
   * Suspend a user
   */
  static async suspendUser(userId: string): Promise<{
    success: boolean;
    message: string;
    user?: {
      id: string;
      name: string;
      email: string;
      status: string;
    };
  }> {
    console.log('🔍 AdminService: Suspending user...', userId);
    try {
      const response = await apiClient.post(`/admin/users/${userId}/suspend`);
      console.log('✅ AdminService: User suspended:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to suspend user:', error);
      throw error;
    }
  }

  /**
   * Unsuspend a user
   */
  static async unsuspendUser(userId: string): Promise<{
    success: boolean;
    message: string;
    user?: {
      id: string;
      name: string;
      email: string;
      status: string;
    };
  }> {
    console.log('🔍 AdminService: Unsuspending user...', userId);
    try {
      const response = await apiClient.post(`/admin/users/${userId}/unsuspend`);
      console.log('✅ AdminService: User unsuspended:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to unsuspend user:', error);
      throw error;
    }
  }

  /**
   * Get agents for admin management
   */
  static async getAgents(params?: {
    search?: string;
    status?: string;
    approval?: string;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
  }): Promise<{
    success: boolean;
    agents: AdminAgent[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    statistics: {
      total: number;
      active: number;
      pending: number;
      approved: number;
      suspended: number;
    };
  }> {
    console.log('🔍 AdminService: Getting agents...', params);
    try {
      const response = await apiClient.get('/admin/agents', { params });
      console.log('✅ AdminService: Agents received:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to get agents:', error);
      throw error;
    }
  }

  /**
   * Approve an agent
   */
  static async approveAgent(agentId: string): Promise<{
    success: boolean;
    message: string;
    agent?: {
      id: string;
      name: string;
      email: string;
      status: string;
      admin_approved: boolean;
    };
  }> {
    console.log('🔍 AdminService: Approving agent...', agentId);
    try {
      const response = await apiClient.post(`/admin/agents/${agentId}/approve`);
      console.log('✅ AdminService: Agent approved:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to approve agent:', error);
      throw error;
    }
  }

  /**
   * Reject an agent
   */
  static async rejectAgent(agentId: string): Promise<{
    success: boolean;
    message: string;
    agent?: {
      id: string;
      name: string;
      email: string;
      status: string;
      admin_approved: boolean;
    };
  }> {
    console.log('🔍 AdminService: Rejecting agent...', agentId);
    try {
      const response = await apiClient.post(`/admin/agents/${agentId}/reject`);
      console.log('✅ AdminService: Agent rejected:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to reject agent:', error);
      throw error;
    }
  }

  /**
   * Suspend an agent
   */
  static async suspendAgent(agentId: string): Promise<{
    success: boolean;
    message: string;
    agent?: {
      id: string;
      name: string;
      email: string;
      status: string;
    };
  }> {
    console.log('🔍 AdminService: Suspending agent...', agentId);
    try {
      const response = await apiClient.post(`/admin/agents/${agentId}/suspend`);
      console.log('✅ AdminService: Agent suspended:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to suspend agent:', error);
      throw error;
    }
  }

  /**
   * Activate an agent
   */
  static async activateAgent(agentId: string): Promise<{
    success: boolean;
    message: string;
    agent?: {
      id: string;
      name: string;
      email: string;
      status: string;
    };
  }> {
    console.log('🔍 AdminService: Activating agent...', agentId);
    try {
      const response = await apiClient.post(`/admin/agents/${agentId}/activate`);
      console.log('✅ AdminService: Agent activated:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to activate agent:', error);
      throw error;
    }
  }

  static async getAgentStatistics(agentId: string) {
    console.log('🔍 AdminService: Fetching agent statistics...', agentId);
    try {
      const response = await apiClient.get(`/admin/agents/${agentId}/statistics`);
      console.log('✅ AdminService: Agent statistics fetched:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to fetch agent statistics:', error);
      throw error;
    }
  }

  static async getAgentPerformanceStats() {
    console.log('🔍 AdminService: Fetching agent performance statistics...');
    try {
      const response = await apiClient.get('/admin/agents/performance-stats');
      console.log('✅ AdminService: Agent performance statistics fetched:', response);
      return response as any;
    } catch (error) {
      console.error('❌ AdminService: Failed to fetch agent performance statistics:', error);
      throw error;
    }
  }
}
