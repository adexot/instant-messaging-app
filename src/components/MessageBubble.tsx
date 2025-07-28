import { CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showTimestamp?: boolean;
}

export function MessageBubble({ 
  message, 
  isOwnMessage, 
  showTimestamp = true 
}: MessageBubbleProps) {
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

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  return (
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
              : "bg-card border text-foreground rounded-bl-md"
          )}
        >
          {/* Message content */}
          <div className="whitespace-pre-wrap text-sm sm:text-sm leading-relaxed select-text">
            {message.content}
          </div>
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
  );
}