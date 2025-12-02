import { useState, useMemo } from 'react';

export interface PasswordStrength {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export const usePasswordStrength = (password: string): PasswordStrength => {
  return useMemo(() => {
    if (!password) {
      return {
        score: 0,
        level: 'weak',
        feedback: [],
        requirements: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
        },
      };
    }

    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (password.length >= 8) score += 20;
    else if (password.length >= 6) score += 10;
    else feedback.push('Use at least 8 characters');

    // Character variety scoring
    if (requirements.uppercase) score += 20;
    else feedback.push('Add uppercase letters');

    if (requirements.lowercase) score += 20;
    else feedback.push('Add lowercase letters');

    if (requirements.number) score += 20;
    else feedback.push('Add numbers');

    if (requirements.special) score += 20;
    else feedback.push('Add special characters');

    // Bonus for longer passwords
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      feedback.push('Avoid repeated characters');
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      score -= 15;
      feedback.push('Avoid common patterns');
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    let level: PasswordStrength['level'] = 'weak';
    if (score >= 80) level = 'very-strong';
    else if (score >= 60) level = 'strong';
    else if (score >= 40) level = 'good';
    else if (score >= 20) level = 'fair';

    return {
      score,
      level,
      feedback,
      requirements,
    };
  }, [password]);
};
