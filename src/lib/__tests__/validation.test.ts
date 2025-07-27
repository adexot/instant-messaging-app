import { describe, it, expect } from 'vitest';
import { validateAlias, validateMessage, sanitizeInput, formatValidationError } from '../validation';
import { ALIAS_CONSTRAINTS, MESSAGE_CONSTRAINTS } from '@/types';

describe('validateAlias', () => {
  it('returns valid for correct alias', () => {
    const result = validateAlias('testuser');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns invalid for empty alias', () => {
    const result = validateAlias('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Alias is required');
  });

  it('returns invalid for whitespace-only alias', () => {
    const result = validateAlias('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Alias is required');
  });

  it('returns invalid for alias too short', () => {
    const result = validateAlias('a');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(`Alias must be at least ${ALIAS_CONSTRAINTS.MIN_LENGTH} characters`);
  });

  it('returns invalid for alias too long', () => {
    const longAlias = 'a'.repeat(ALIAS_CONSTRAINTS.MAX_LENGTH + 1);
    const result = validateAlias(longAlias);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(`Alias must be no more than ${ALIAS_CONSTRAINTS.MAX_LENGTH} characters`);
  });

  it('returns invalid for alias with invalid characters', () => {
    const result = validateAlias('test@user');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Alias can only contain letters, numbers, underscores, and hyphens');
  });

  it('accepts valid characters', () => {
    const validAliases = ['test_user', 'test-user', 'testuser123', 'TEST_USER', '123test'];

    validAliases.forEach(alias => {
      const result = validateAlias(alias);
      expect(result.isValid).toBe(true);
    });
  });

  it('trims whitespace before validation', () => {
    const result = validateAlias('  testuser  ');
    expect(result.isValid).toBe(true);
  });

  it('handles minimum length boundary', () => {
    const minLengthAlias = 'a'.repeat(ALIAS_CONSTRAINTS.MIN_LENGTH);
    const result = validateAlias(minLengthAlias);
    expect(result.isValid).toBe(true);
  });

  it('handles maximum length boundary', () => {
    const maxLengthAlias = 'a'.repeat(ALIAS_CONSTRAINTS.MAX_LENGTH);
    const result = validateAlias(maxLengthAlias);
    expect(result.isValid).toBe(true);
  });
});

describe('validateMessage', () => {
  it('returns valid for correct message', () => {
    const result = validateMessage('Hello world!');
    expect(result.isValid).toBe(true);
    expect(result.trimmedContent).toBe('Hello world!');
    expect(result.error).toBeUndefined();
  });

  it('returns invalid for empty message', () => {
    const result = validateMessage('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Message cannot be empty');
    expect(result.trimmedContent).toBe('');
  });

  it('returns invalid for whitespace-only message', () => {
    const result = validateMessage('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Message cannot be empty');
    expect(result.trimmedContent).toBe('');
  });

  it('returns invalid for message too long', () => {
    const longMessage = 'a'.repeat(MESSAGE_CONSTRAINTS.MAX_LENGTH + 1);
    const result = validateMessage(longMessage);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(`Message must be no more than ${MESSAGE_CONSTRAINTS.MAX_LENGTH} characters`);
  });

  it('trims whitespace and returns trimmed content', () => {
    const result = validateMessage('  Hello world!  ');
    expect(result.isValid).toBe(true);
    expect(result.trimmedContent).toBe('Hello world!');
  });

  it('handles maximum length boundary', () => {
    const maxLengthMessage = 'a'.repeat(MESSAGE_CONSTRAINTS.MAX_LENGTH);
    const result = validateMessage(maxLengthMessage);
    expect(result.isValid).toBe(true);
    expect(result.trimmedContent).toBe(maxLengthMessage);
  });

  it('handles minimum length boundary', () => {
    const minLengthMessage = 'a'.repeat(MESSAGE_CONSTRAINTS.MIN_LENGTH);
    const result = validateMessage(minLengthMessage);
    expect(result.isValid).toBe(true);
    expect(result.trimmedContent).toBe(minLengthMessage);
  });
});

describe('sanitizeInput', () => {
  describe('alias', () => {
    it('converts to lowercase', () => {
      expect(sanitizeInput.alias('TestUser')).toBe('testuser');
    });

    it('removes invalid characters', () => {
      expect(sanitizeInput.alias('test@user!')).toBe('testuser');
    });

    it('trims whitespace', () => {
      expect(sanitizeInput.alias('  testuser  ')).toBe('testuser');
    });

    it('preserves valid characters', () => {
      expect(sanitizeInput.alias('test_user-123')).toBe('test_user-123');
    });
  });

  describe('message', () => {
    it('trims whitespace', () => {
      expect(sanitizeInput.message('  Hello world!  ')).toBe('Hello world!');
    });

    it('normalizes multiple spaces', () => {
      expect(sanitizeInput.message('Hello    world!')).toBe('Hello world!');
    });

    it('normalizes mixed whitespace', () => {
      expect(sanitizeInput.message('Hello\t\n  world!')).toBe('Hello world!');
    });
  });
});

describe('formatValidationError', () => {
  it('formats error message correctly', () => {
    const result = formatValidationError('Alias', 'is required');
    expect(result).toBe('Alias: is required');
  });

  it('handles empty field name', () => {
    const result = formatValidationError('', 'is required');
    expect(result).toBe(': is required');
  });

  it('handles empty error message', () => {
    const result = formatValidationError('Alias', '');
    expect(result).toBe('Alias: ');
  });
});
