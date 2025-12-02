import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface PublicRouteProps {
  children: ReactNode;
  redirectPath?: string;
}

export const PublicRoute = ({ 
  children, 
  redirectPath 
}: PublicRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to appropriate dashboard
  if (isAuthenticated && user) {
    const defaultRedirect = getRedirectPath(user.user_type);
    return <Navigate to={redirectPath || defaultRedirect} replace />;
  }

  return <>{children}</>;
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
