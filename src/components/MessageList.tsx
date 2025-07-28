import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { ScrollArea } from '../../@/components/ui/scroll-area';
import { Button } from '../../@/components/ui/button';
import { MessageBubble } from './MessageBubble';
import { LoadingSpinner } from './ui/loading';
import { ErrorMessage } from './ui/error';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Message, User } from '../types';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  isLoading?: boolean;
  error?: string;
  onLoadMore?: () => void;
  hasMoreMessages?: boolean;
  onRetryFailedMessage?: (messageId: string) => void;
}

export const MessageList = forwardRef<{ scrollToBottom: () => void }, MessageListProps>(function MessageList({
  messages,
  currentUser,
  isLoading = false,
  error,
  onLoadMore,
  hasMoreMessages = false,
  onRetryFailedMessage,
}, ref) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Auto-scroll to bottom for new messages
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto' 
    });
  };

  // Expose scrollToBottom to parent component
  useImperativeHandle(ref, () => ({
    scrollToBottom: () => scrollToBottom(true),
  }), []);

  // Check if user is near bottom of scroll area
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;
    
    setIsNearBottom(nearBottom);
    setShowScrollToBottom(!nearBottom && messages.length > 0);

    // Load more messages when scrolled to top
    if (scrollTop === 0 && hasMoreMessages && onLoadMore && !isLoadingMore) {
      setIsLoadingMore(true);
      onLoadMore();
      // Reset loading state after a delay
      setTimeout(() => setIsLoadingMore(false), 1000);
    }
  };

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    if (isNearBottom && messages.length > 0) {
      // Use a small delay to ensure DOM is updated
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages.length, isNearBottom]);

  // Initial scroll to bottom when component mounts
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(false);
    }
  }, []);

  const handleRetryMessage = (messageId: string) => {
    if (onRetryFailedMessage) {
      onRetryFailedMessage(messageId);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="flex-1 relative flex flex-col h-full">
      {/* Chat Header - Mobile optimized */}
      <div className="border-b bg-muted/30 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="font-semibold text-base sm:text-lg truncate">Messages</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {messages.length === 0 ? 'No messages yet' : `${messages.length} messages`}
            </p>
          </div>
          {hasMoreMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-muted-foreground shrink-0 min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto touch-manipulation"
            >
              {isLoadingMore ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Load more</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area - Mobile optimized scrolling */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1"
        onScroll={handleScroll}
      >
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          {/* Messages */}
          {messages.length === 0 && !isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <p className="text-lg font-medium text-muted-foreground mb-1">No messages yet</p>
                  <p className="text-sm text-muted-foreground">Start the conversation!</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === currentUser.id;
                const showTimestamp = true;
                
                return (
                  <div key={message.id} className="relative">
                    <MessageBubble
                      message={message}
                      isOwnMessage={isOwnMessage}
                      showTimestamp={showTimestamp}
                    />
                    
                    {/* Retry button for failed messages - Touch optimized */}
                    {message.status === 'failed' && isOwnMessage && (
                      <div className="flex justify-end -mt-2 mb-2 px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetryMessage(message.id)}
                          className="text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive/10 min-h-[32px] touch-manipulation active:scale-95 sm:active:scale-100"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="flex items-center space-x-2">
                <LoadingSpinner />
                <span className="text-sm text-muted-foreground">Loading messages...</span>
              </div>
            </div>
          )}

          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Scroll to bottom button - Touch optimized */}
      {showScrollToBottom && (
        <Button
          variant="secondary"
          size="sm"
          className={cn(
            "absolute bottom-4 sm:bottom-6 right-3 sm:right-6 rounded-full shadow-lg border",
            "transition-all duration-200 ease-in-out min-h-[48px] min-w-[48px] sm:min-h-auto sm:min-w-auto",
            "hover:scale-105 active:scale-95 bg-background/80 backdrop-blur-sm touch-manipulation"
          )}
          onClick={() => scrollToBottom()}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});