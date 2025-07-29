import { CheckCheck, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../../@/components/ui/button';
import { useToastHelpers } from './ui/toast';
import { ErrorBoundary } from './ErrorBoundary';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showTimestamp?: boolean;
  onRetry?: (messageId: string) => void;
}

export function MessageBubble({ 
  message, 
  isOwnMessage, 
  showTimestamp = true,
  onRetry
}: MessageBubbleProps) {
  const toast = useToastHelpers();
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
                title="Retry sending message"
              >
                <RotateCcw className="h-3 w-3" />
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
      >
        <div className={cn("flex flex-col", isOwnMessage ? "items-end" : "items-start")}>
          {/* Sender alias for received messages */}
          {!isOwnMessage && (
            <div className="text-xs font-medium text-muted-foreground mb-1 px-2 sm:px-3">
              {message.senderAlias}
            </div>
          )}
          
          <div
            className={cn(
              "max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 break-words shadow-sm",
              "transition-all duration-200 group-hover:shadow-md touch-manipulation",
              "selection:bg-primary/20",
              isOwnMessage
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border text-foreground rounded-bl-md",
              message.status === 'failed' && isOwnMessage && "bg-destructive/10 border-destructive/20 text-foreground"
            )}
          >
            {/* Message content */}
            <div className="whitespace-pre-wrap text-sm sm:text-sm leading-relaxed select-text">
              {message.content}
            </div>
            
            {/* Failed message indicator */}
            {message.status === 'failed' && isOwnMessage && (
              <div className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>Failed to send</span>
              </div>
            )}
          </div>
          
          {/* Timestamp and status - Always visible on mobile */}
          {showTimestamp && (
            <div
              className={cn(
                "flex items-center gap-1 mt-1 px-2 sm:px-3 text-xs transition-opacity",
                "opacity-70 sm:opacity-0 sm:group-hover:opacity-100",
                isOwnMessage 
                  ? "text-muted-foreground justify-end" 
                  : "text-muted-foreground justify-start"
              )}
            >
              <span>{formatTimestamp(message.timestamp)}</span>
              {isOwnMessage && getStatusIcon()}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}