import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'agent' | 'admin';
  fallbackPath?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  fallbackPath = '/auth' 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

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

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const userRole = user.user_type;
    
    // Map user types to required roles
    const roleMapping: Record<string, string> = {
      'personal': 'user',
      'agent': 'agent', 
      'admin': 'admin'
    };

    const mappedUserRole = roleMapping[userRole];
    
    if (mappedUserRole !== requiredRole) {
      // Redirect to appropriate dashboard based on user's actual role
      const redirectPath = getRedirectPath(userRole);
      return <Navigate to={redirectPath} replace />;
    }
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
