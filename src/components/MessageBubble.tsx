import React from 'react';
import { CheckCheck, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../../@/components/ui/button';
import { useToastHelpers } from './ui/toast';
import { useAriaId } from '../hooks/useAccessibility';
import { ErrorBoundary } from './ErrorBoundary';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showTimestamp?: boolean;
  onRetry?: (messageId: string) => void;
}

export const MessageBubble = React.memo(function MessageBubble({ 
  message, 
  isOwnMessage, 
  showTimestamp = true,
  onRetry
}: MessageBubbleProps) {
  const toast = useToastHelpers();
  const messageId = useAriaId('message');
  const timestampId = useAriaId('timestamp');
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    
    // If message is from today, show only time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // If message is from this year, show month/day and time
    if (messageDate.getFullYear() === now.getFullYear()) {
      return messageDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Otherwise show full date and time
    return messageDate.toLocaleDateString([], { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleRetry = () => {
    if (onRetry && message.id) {
      onRetry(message.id);
      toast.info('Retrying message', 'Attempting to send message again...');
    }
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'failed':
        return (
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-destructive" />
            {onRetry && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRetry}
                className="h-4 w-4 p-0 text-destructive hover:text-destructive/80"
                aria-label="Retry sending message"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
              </Button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="flex w-full mb-2 sm:mb-3 justify-center">
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
            Failed to render message
          </div>
        </div>
      }
    >
      <div
        className={cn(
          "flex w-full mb-2 sm:mb-3 group",
          isOwnMessage ? "justify-end" : "justify-start"
        )}
        role="group"
        aria-labelledby={messageId}
      >
        <div className={cn("flex flex-col", isOwnMessage ? "items-end" : "items-start")}>
          {/* Sender alias for received messages */}
          {!isOwnMessage && (
            <div 
              className="text-xs font-medium text-muted-foreground mb-1 px-2 sm:px-3"
              aria-label={`Message from ${message.senderAlias}`}
            >
              {message.senderAlias}
            </div>
          )}
          
          <div
            id={messageId}
            className={cn(
              "max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 break-words shadow-sm",
              "transition-all duration-200 group-hover:shadow-md touch-manipulation",
              "selection:bg-primary/20",
              isOwnMessage
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border text-foreground rounded-bl-md",
              message.status === 'failed' && isOwnMessage && "bg-destructive/10 border-destructive/20 text-foreground"
            )}
            role="article"
            aria-describedby={showTimestamp ? timestampId : undefined}
            aria-label={`${isOwnMessage ? 'Your' : message.senderAlias + "'s"} message`}
          >
            {/* Message content */}
            <div 
              className="whitespace-pre-wrap text-sm sm:text-sm leading-relaxed select-text"
              role="text"
            >
              {message.content}
            </div>
            
            {/* Failed message indicator */}
            {message.status === 'failed' && isOwnMessage && (
              <div 
                className="text-xs text-destructive mt-1 flex items-center gap-1"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                <span>Failed to send</span>
              </div>
            )}
          </div>
          
          {/* Timestamp and status - Always visible on mobile */}
          {showTimestamp && (
            <div
              id={timestampId}
              className={cn(
                "flex items-center gap-1 mt-1 px-2 sm:px-3 text-xs transition-opacity",
                "opacity-70 sm:opacity-0 sm:group-hover:opacity-100",
                isOwnMessage 
                  ? "text-muted-foreground justify-end" 
                  : "text-muted-foreground justify-start"
              )}
              aria-label={`Sent at ${formatTimestamp(message.timestamp)}`}
            >
              <span>{formatTimestamp(message.timestamp)}</span>
              {isOwnMessage && (
                <span aria-label={`Message status: ${message.status || 'delivered'}`}>
                  {getStatusIcon()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
});