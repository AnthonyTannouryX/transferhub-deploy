import React from 'react';
import { Check, X, Shield, ShieldCheck, AlertTriangle } from 'lucide-react';
import { usePasswordStrength } from '@/hooks/usePasswordStrength';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
}) => {
  const strength = usePasswordStrength(password);

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'very-strong':
        return 'from-green-500 to-emerald-600';
      case 'strong':
        return 'from-green-400 to-green-600';
      case 'good':
        return 'from-yellow-400 to-orange-500';
      case 'fair':
        return 'from-orange-400 to-red-500';
      case 'weak':
      default:
        return 'from-red-400 to-red-600';
    }
  };

  const getStrengthText = (level: string) => {
    switch (level) {
      case 'very-strong':
        return 'Very Strong';
      case 'strong':
        return 'Strong';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'weak':
      default:
        return 'Weak';
    }
  };

  const getStrengthIcon = (level: string) => {
    switch (level) {
      case 'very-strong':
        return <ShieldCheck className="w-4 h-4" />;
      case 'strong':
        return <ShieldCheck className="w-4 h-4" />;
      case 'good':
        return <Shield className="w-4 h-4" />;
      case 'fair':
        return <AlertTriangle className="w-4 h-4" />;
      case 'weak':
      default:
        return <X className="w-4 h-4" />;
    }
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <div className="flex items-center gap-2">
            {getStrengthIcon(strength.level)}
            <span className={`text-sm font-semibold ${
              strength.level === 'very-strong' ? 'text-green-600' :
              strength.level === 'strong' ? 'text-green-500' :
              strength.level === 'good' ? 'text-yellow-500' :
              strength.level === 'fair' ? 'text-orange-500' :
              'text-red-500'
            }`}>
              {getStrengthText(strength.level)}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getStrengthColor(strength.level)} transition-all duration-500 ease-out`}
            style={{ width: `${strength.score}%` }}
          />
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          {strength.score}% strength
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Requirements:</div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                strength.requirements.length ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {strength.requirements.length ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <X className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <span className={`text-sm ${
                strength.requirements.length ? 'text-green-700' : 'text-gray-500'
              }`}>
                At least 8 characters
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                strength.requirements.uppercase ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {strength.requirements.uppercase ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <X className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <span className={`text-sm ${
                strength.requirements.uppercase ? 'text-green-700' : 'text-gray-500'
              }`}>
                Uppercase letter (A-Z)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                strength.requirements.lowercase ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {strength.requirements.lowercase ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <X className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <span className={`text-sm ${
                strength.requirements.lowercase ? 'text-green-700' : 'text-gray-500'
              }`}>
                Lowercase letter (a-z)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                strength.requirements.number ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {strength.requirements.number ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <X className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <span className={`text-sm ${
                strength.requirements.number ? 'text-green-700' : 'text-gray-500'
              }`}>
                Number (0-9)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                strength.requirements.special ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {strength.requirements.special ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <X className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <span className={`text-sm ${
                strength.requirements.special ? 'text-green-700' : 'text-gray-500'
              }`}>
                Special character (!@#$%^&*)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-700">Suggestions:</div>
          {strength.feedback.map((message, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-1 h-1 bg-orange-400 rounded-full" />
              <span className="text-sm text-orange-600">{message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
