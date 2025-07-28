import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '../../@/components/ui/button';
import { Input } from '../../@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { MESSAGE_CONSTRAINTS } from '../types';

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
  const inputRef = useRef<HTMLInputElement>(null);
  
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
    
    // Enforce character limit
    if (value.length <= MESSAGE_CONSTRAINTS.MAX_LENGTH) {
      setMessage(value);
      
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
    if (!trimmedMessage || isSending || disabled) {
      return;
    }

    // Validate message length
    if (trimmedMessage.length < MESSAGE_CONSTRAINTS.MIN_LENGTH) {
      return;
    }

    setIsSending(true);
    handleTypingStop(); // Stop typing indicator when sending

    try {
      await onSendMessage(trimmedMessage);
      setMessage(''); // Clear input on successful send
      
      // Focus back to input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Keep the message in input if sending failed
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

  const isMessageValid = message.trim().length >= MESSAGE_CONSTRAINTS.MIN_LENGTH;
  const characterCount = message.length;
  const isNearLimit = characterCount > MESSAGE_CONSTRAINTS.MAX_LENGTH * 0.8;

  return (
    <div className="border-t bg-card/50 backdrop-blur-sm p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
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
                characterCount >= MESSAGE_CONSTRAINTS.MAX_LENGTH && "border-destructive focus:border-destructive"
              )}
              maxLength={MESSAGE_CONSTRAINTS.MAX_LENGTH}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck="true"
            />
            
            {/* Character counter */}
            {isNearLimit && (
              <div className={cn(
                "absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none",
                characterCount >= MESSAGE_CONSTRAINTS.MAX_LENGTH 
                  ? "text-destructive" 
                  : "text-warning"
              )}>
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
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Helper text - Mobile optimized */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span className="hidden sm:inline">Press Enter to send</span>
          <span className="sm:hidden">Tap to send</span>
          {!isNearLimit && (
            <span>{characterCount}/{MESSAGE_CONSTRAINTS.MAX_LENGTH}</span>
          )}
        </div>
      </form>
    </div>
  );
});