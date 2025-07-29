
import React from 'react';
import { cn } from '../lib/utils';
import type { TypingStatus } from '../types';

interface TypingIndicatorProps {
  typingUsers: TypingStatus[];
  className?: string;
}

export const TypingIndicator = React.memo(function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    const count = typingUsers.length;
    
    if (count === 1) {
      return `${typingUsers[0].userAlias} is typing...`;
    } else if (count === 2) {
      return `${typingUsers[0].userAlias} and ${typingUsers[1].userAlias} are typing...`;
    } else if (count === 3) {
      return `${typingUsers[0].userAlias}, ${typingUsers[1].userAlias}, and ${typingUsers[2].userAlias} are typing...`;
    } else {
      return `${typingUsers[0].userAlias}, ${typingUsers[1].userAlias}, and ${count - 2} others are typing...`;
    }
  };

  return (
    <div 
      className={cn(
        "px-6 py-2 text-sm text-muted-foreground border-t bg-muted/30",
        "animate-in slide-in-from-bottom-2 duration-200",
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Typing indicator"
    >
      <div className="flex items-center gap-2">
        {/* Animated typing dots */}
        <div className="flex gap-1" aria-hidden="true">
          <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
        </div>
        
        {/* Typing text */}
        <span className="italic">
          {getTypingText()}
        </span>
      </div>
    </div>
  );
});