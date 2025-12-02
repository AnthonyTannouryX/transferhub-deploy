import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, authUtils, User, LoginData, RegisterData } from '../services/authApi';
import { useToast } from './use-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: { token: string; password: string; password_confirmation: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): AuthContextType => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authUtils.getToken();
        const user = authUtils.getUserData();

        if (token && user) {
          setAuthState({
            user,
            token,
            isLoading: false,
            isAuthenticated: true,
          });

          // Verify token is still valid by fetching user data
          await refreshUser();
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        // Clear invalid auth data
        authUtils.clearAuthData();
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me() as { success: boolean; user: User; message?: string; error?: string };
      if (response.success && response.user) {
        setAuthState(prev => ({
          ...prev,
          user: response.user,
          isAuthenticated: true,
        }));
        authUtils.saveAuthData(authUtils.getToken()!, response.user);
      }
    } catch (error) {
      // Token might be invalid, logout
      logout();
    }
  }, []);

  const login = useCallback(async (data: LoginData) => {
    try {
      const response = await authApi.login(data);
      
      if (response.success && response.token && response.user) {
        setAuthState({
          user: response.user,
          token: response.token,
          isLoading: false,
          isAuthenticated: true,
        });

        authUtils.saveAuthData(response.token, response.user);

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });

        // Redirect based on user type
        const redirectPath = getRedirectPath(response.user.user_type);
        navigate(redirectPath);
      }
    } catch (error) {
      // Get specific error message from the error
      let errorMessage = "Login failed. Please try again.";
      let errorTitle = "Login Failed";
      
      if (error instanceof Error) {
        const message = error.message;
        
        if (message.includes('Invalid credentials')) {
          errorTitle = "Invalid Credentials";
          errorMessage = "The email or password you entered is incorrect. Please check your credentials and try again.";
        } else if (message.includes('Please verify your email')) {
          errorTitle = "Email Not Verified";
          errorMessage = "Please check your email and click the verification link before logging in.";
        } else if (message.includes('account has been suspended')) {
          errorTitle = "Account Suspended";
          errorMessage = "Your account has been suspended. Please contact support for assistance.";
        } else if (message.includes('pending admin approval')) {
          errorTitle = "Account Pending Approval";
          errorMessage = "Your agent account is pending admin approval. You'll be notified once approved.";
        } else if (message.includes('Login failed')) {
          errorTitle = "Login Failed";
          errorMessage = "Unable to log in. Please try again later.";
        } else {
          errorTitle = "Login Error";
          errorMessage = message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }, [navigate, toast]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);
      
      if (response.success) {
        toast({
          title: "Account Created!",
          description: "Please check your email for verification.",
        });

        // Redirect to verification page with email parameter
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
      throw error;
    }
  }, [navigate, toast]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
    } finally {
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });

      authUtils.clearAuthData();

      toast({
        title: "Logged Out",
        description: "You've been successfully logged out.",
      });

      navigate('/auth');
    }
  }, [navigate, toast]);

  const verifyEmail = useCallback(async (token: string) => {
    try {
      const response = await authApi.verifyEmail({ token });
      
      if (response.success) {
        toast({
          title: "Email Verified!",
          description: "Your email has been verified successfully.",
        });

        // Redirect to login with success message
        navigate('/auth', { 
          state: { message: 'Email verified successfully! Please login.' } 
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify email",
        variant: "destructive",
      });
      throw error;
    }
  }, [navigate, toast]);

  const resendVerification = useCallback(async (email: string) => {
    try {
      const response = await authApi.resendVerification({ email });
      
      if (response.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your email for the verification link.",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to Send",
        description: error instanceof Error ? error.message : "Failed to resend verification email",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      const response = await authApi.forgotPassword({ email });
      
      if (response.success) {
        toast({
          title: "Reset Link Sent",
          description: "If the email exists, a password reset link has been sent.",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to Send",
        description: error instanceof Error ? error.message : "Failed to send reset link",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const resetPassword = useCallback(async (data: { token: string; password: string; password_confirmation: string }) => {
    try {
      const response = await authApi.resetPassword(data);
      
      if (response.success) {
        toast({
          title: "Password Reset!",
          description: "Your password has been reset successfully.",
        });

        // Redirect to login with success message
        navigate('/auth', { 
          state: { message: 'Password reset successfully! Please login.' } 
        });
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
      throw error;
    }
  }, [navigate, toast]);

  return {
    ...authState,
    login,
    register,
    logout,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    refreshUser,
  };
};

// Helper function to get redirect path based on user type
const getRedirectPath = (userType: string): string => {
  switch (userType) {
    case 'admin':
      return '/admin/dashboard';
    case 'agent':
      return '/agent/dashboard';
    case 'personal':
    default:
      return '/user/dashboard';
  }
};
