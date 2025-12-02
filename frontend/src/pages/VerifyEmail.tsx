import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);
  const [email, setEmail] = useState<string>(() => {
    const urlEmail = searchParams.get('email');
    
    if (urlEmail) {
      return urlEmail;
    }
    
    // Try to get email from localStorage (if user just registered)
    const userData = localStorage.getItem('transferhub_user_data');
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.email) {
          return user.email;
        }
      } catch (error) {
        // Error parsing user data, continue with empty email
      }
    }
    
    return '';
  });
  const { verifyEmail, resendVerification } = useAuth();

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleVerification(token);
    } else {
      // If no token and no email, redirect to signup
      if (!email) {
        navigate('/auth', { 
          state: { 
            message: 'Please sign up first to receive a verification email.' 
          } 
        });
        return;
      }
      setStatus('error');
      setMessage('Please check your email for the verification link. If you don\'t see it, check your spam folder or click the resend button below.');
    }
  }, [token, email, navigate]);

  const handleVerification = async (verificationToken: string) => {
    try {
      await verifyEmail(verificationToken);
      setStatus('success');
      setMessage('Your email has been verified successfully!');
    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
      if (errorMessage.includes('Invalid verification token')) {
        setMessage('This verification link is invalid or has expired. Please request a new verification email.');
      } else {
        setMessage(errorMessage);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      navigate('/auth', { 
        state: { 
          message: 'Please sign up first to receive a verification email.' 
        } 
      });
      return;
    }
    
    setIsResending(true);
    try {
      await resendVerification(email);
      // Toast notification is handled by the useAuth hook
    } catch (error) {
      // Error toast is handled by the useAuth hook
    } finally {
      setIsResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-600" />;
      case 'error':
        return <Mail className="w-16 h-16 text-blue-600" />;
      default:
        return <Mail className="w-16 h-16 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md ${getStatusColor()}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'verifying' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Email Verification'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Your email has been successfully verified'}
            {status === 'error' && 'Let\'s get your email verified'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={status === 'success' ? 'default' : 'default'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                You can now sign in to your TransferHub account.
              </p>
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                Go to Sign In
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Don't worry! We can help you get verified.
              </p>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleResendVerification}
                  variant="outline"
                  className="w-full"
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
              </div>
              
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          )}

          {status === 'verifying' && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                This may take a few moments...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
