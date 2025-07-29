import { 
  ALIAS_CONSTRAINTS, 
  MESSAGE_CONSTRAINTS,
  type AliasValidation,
  type MessageValidation 
} from '@/types';

// Alias validation functions
export const validateAlias = (alias: string): AliasValidation => {
  const trimmed = alias.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Alias is required',
    };
  }
  
  if (trimmed.length < ALIAS_CONSTRAINTS.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Alias must be at least ${ALIAS_CONSTRAINTS.MIN_LENGTH} characters`,
    };
  }
  
  if (trimmed.length > ALIAS_CONSTRAINTS.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Alias must be no more than ${ALIAS_CONSTRAINTS.MAX_LENGTH} characters`,
    };
  }
  
  if (!ALIAS_CONSTRAINTS.PATTERN.test(trimmed)) {
    return {
      isValid: false,
      error: 'Alias can only contain letters, numbers, underscores, and hyphens',
    };
  }
  
  return {
    isValid: true,
  };
};

// Message validation functions
export const validateMessage = (content: string): MessageValidation => {
  const trimmed = content.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Message cannot be empty',
      trimmedContent: trimmed,
    };
  }
  
  if (trimmed.length < MESSAGE_CONSTRAINTS.MIN_LENGTH) {
    return {
      isValid: false,
      error: 'Message is too short',
      trimmedContent: trimmed,
    };
  }
  
  if (trimmed.length > MESSAGE_CONSTRAINTS.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Message must be no more than ${MESSAGE_CONSTRAINTS.MAX_LENGTH} characters`,
      trimmedContent: trimmed,
    };
  }
  
  return {
    isValid: true,
    trimmedContent: trimmed,
  };
};

// Sanitization functions
export const sanitizeInput = {
  alias: (input: string): string => {
    return input.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  },
  
  message: (input: string): string => {
    // Normalize whitespace and remove potentially dangerous characters
    return input
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  },
};

// Enhanced validation with security checks
export const validateAndSanitize = {
  alias: (input: string): { isValid: boolean; sanitized: string; error?: string } => {
    const sanitized = sanitizeInput.alias(input);
    const validation = validateAlias(sanitized);
    
    return {
      isValid: validation.isValid,
      sanitized,
      error: validation.error,
    };
  },
  
  message: (input: string): { isValid: boolean; sanitized: string; error?: string } => {
    const sanitized = sanitizeInput.message(input);
    const validation = validateMessage(sanitized);
    
    return {
      isValid: validation.isValid,
      sanitized,
      error: validation.error,
    };
  },
};

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }
  
  getRemainingTime(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length < this.maxAttempts) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const remainingTime = this.windowMs - (Date.now() - oldestAttempt);
    
    return Math.max(0, remainingTime);
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Format validation error messages
export const formatValidationError = (field: string, error: string): string => {
  return `${field}: ${error}`;
};