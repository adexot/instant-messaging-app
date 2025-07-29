import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '../../@/components/ui/button';
import { Input } from '../../@/components/ui/input';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { MESSAGE_CONSTRAINTS } from '../types';
import { validateAndSanitize, RateLimiter } from '../lib/validation';
import { useToastHelpers } from './ui/toast';
import { useScreenReader, useAriaId } from '../hooks/useAccessibility';
import { ErrorBoundary } from './ErrorBoundary';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export const MessageInput = forwardRef<HTMLInputElement, MessageInputProps>(function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  onTypingStart,
  onTypingStop,
}, ref) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rateLimiterRef = useRef(new RateLimiter(30, 60000)); // 30 messages per minute
  const toast = useToastHelpers();
  const { announce } = useScreenReader();
  
  // Generate stable IDs for ARIA relationships
  const errorMessageId = useAriaId('message-error');
  const characterCountId = useAriaId('character-count');
  
  // Expose input ref to parent component
  useImperativeHandle(ref, () => inputRef.current!, []);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle typing indicators
  const handleTypingStart = () => {
    if (!isTyping && onTypingStart) {
      setIsTyping(true);
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (onTypingStop) {
        onTypingStop();
      }
    }, 3000); // 3 seconds timeout
  };

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    if (onTypingStop) {
      onTypingStop();
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Clear previous validation error
    setValidationError(null);
    
    // Enforce character limit
    if (value.length <= MESSAGE_CONSTRAINTS.MAX_LENGTH) {
      setMessage(value);
      
      // Validate input in real-time
      if (value.trim()) {
        const validation = validateAndSanitize.message(value);
        if (!validation.isValid) {
          setValidationError(validation.error || 'Invalid message format');
        }
      }
      
      // Trigger typing indicator if user is typing
      if (value.trim() && !disabled) {
        handleTypingStart();
      } else if (!value.trim()) {
        handleTypingStop();
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || disabled || validationError) {
      return;
    }

    // Check rate limiting
    const rateLimiter = rateLimiterRef.current;
    if (!rateLimiter.isAllowed('message-send')) {
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime('message-send') / 1000);
      toast.warning('Slow down!', `Please wait ${remainingTime} seconds before sending another message.`);
      return;
    }

    // Final validation and sanitization
    const validation = validateAndSanitize.message(trimmedMessage);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid message format');
      toast.error('Invalid Message', validation.error || 'Please check your message format');
      return;
    }

    setIsSending(true);
    handleTypingStop(); // Stop typing indicator when sending
    setValidationError(null);

    try {
      await onSendMessage(validation.sanitized);
      setMessage(''); // Clear input on successful send
      announce('Message sent');
      
      // Focus back to input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      // const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Show user-friendly error message
      toast.error('Message Failed', 'Your message could not be sent. Please try again.');
      
      // Keep the message in input if sending failed
      setValidationError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle keyboard shortcuts and mobile keyboard
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter to send (desktop and mobile)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    // Desktop keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          handleSubmit(e);
          break;
        case 'k':
          e.preventDefault();
          // Focus input (Ctrl/Cmd + K)
          inputRef.current?.focus();
          break;
      }
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
      setMessage('');
      handleTypingStop();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Auto-focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const isMessageValid = message.trim().length >= MESSAGE_CONSTRAINTS.MIN_LENGTH && !validationError;
  const characterCount = message.length;
  const isNearLimit = characterCount > MESSAGE_CONSTRAINTS.MAX_LENGTH * 0.8;

  return (
    <ErrorBoundary
      fallback={
        <div className="border-t bg-card/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="flex items-center justify-center space-x-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">Message input failed to load</span>
          </div>
        </div>
      }
    >
      <div 
        className="border-t bg-card/50 backdrop-blur-sm p-3 sm:p-4"
        role="region"
        aria-label="Message input area"
      >
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                id="message-input"
                type="text"
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={disabled ? "Connecting..." : placeholder}
                disabled={disabled || isSending}
                className={cn(
                  "pr-12 sm:pr-14 transition-all duration-200 min-h-[44px] text-base sm:text-sm",
                  "focus:ring-2 focus:ring-primary/20",
                  isNearLimit && "border-warning focus:border-warning",
                  characterCount >= MESSAGE_CONSTRAINTS.MAX_LENGTH && "border-destructive focus:border-destructive",
                  validationError && "border-destructive focus:border-destructive"
                )}
                maxLength={MESSAGE_CONSTRAINTS.MAX_LENGTH}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                spellCheck="true"
                aria-label="Type your message"
                aria-describedby={`${characterCountId} ${validationError ? errorMessageId : ''}`}
                aria-invalid={!!validationError}
                role="textbox"
                aria-multiline="false"
              />
              
              {/* Character counter */}
              {isNearLimit && (
                <div 
                  className={cn(
                    "absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none",
                    characterCount >= MESSAGE_CONSTRAINTS.MAX_LENGTH 
                      ? "text-destructive" 
                      : "text-warning"
                  )}
                  aria-hidden="true"
                >
                  {MESSAGE_CONSTRAINTS.MAX_LENGTH - characterCount}
                </div>
              )}
            </div>
            
            <Button
              type="submit"
              size="icon"
              disabled={!isMessageValid || isSending || disabled}
              className={cn(
                "shrink-0 transition-all duration-200 min-h-[44px] min-w-[44px] touch-manipulation",
                "active:scale-95 sm:active:scale-100",
                isMessageValid && !isSending && !disabled && "bg-primary hover:bg-primary/90"
              )}
              aria-label={isSending ? "Sending message" : "Send message"}
              aria-describedby={validationError ? errorMessageId : undefined}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
          
          {/* Validation error */}
          {validationError && (
            <div 
              id={errorMessageId}
              className="flex items-center space-x-2 text-xs text-destructive"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              <span>{validationError}</span>
            </div>
          )}
          
          {/* Helper text - Mobile optimized */}
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="hidden sm:inline">Press Enter to send</span>
            <span className="sm:hidden">Tap to send</span>
            {!isNearLimit && (
              <span 
                id={characterCountId}
                aria-label={`${characterCount} of ${MESSAGE_CONSTRAINTS.MAX_LENGTH} characters used`}
              >
                {characterCount}/{MESSAGE_CONSTRAINTS.MAX_LENGTH}
              </span>
            )}
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
});