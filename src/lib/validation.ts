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
    return input.trim().replace(/\s+/g, ' '); // Normalize whitespace
  },
};

// Format validation error messages
export const formatValidationError = (field: string, error: string): string => {
  return `${field}: ${error}`;
};