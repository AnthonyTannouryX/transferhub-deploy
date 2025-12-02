import { apiClient } from './apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: string;
  status: string;
  avatar: string;
}

export interface UserSearchResponse {
  success: boolean;
  users: User[];
  message?: string;
}

export interface UserDetailsResponse {
  success: boolean;
  user: User;
  message?: string;
}

class UserService {
  /**
   * Search for users by name, email, or phone
   */
  async searchUsers(query: string): Promise<UserSearchResponse> {
    try {
      const response = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
      return response;
    } catch (error: any) {
      console.error('User search failed:', error);
      return {
        success: false,
        users: [],
        message: error?.message || 'Failed to search users'
      };
    }
  }

  /**
   * Get user details by ID
   */
  async getUserById(id: string): Promise<UserDetailsResponse> {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response;
    } catch (error: any) {
      console.error('Get user failed:', error);
      return {
        success: false,
        user: {} as User,
        message: error.response?.data?.message || 'Failed to get user details'
      };
    }
  }
}

export const userService = new UserService();
