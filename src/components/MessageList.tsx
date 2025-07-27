import React, { useEffect, useRef, useState } from 'react';
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

export function MessageList({
  messages,
  currentUser,
  isLoading = false,
  error,
  onLoadMore,
  hasMoreMessages = false,
  onRetryFailedMessage,
}: MessageListProps) {
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
      {/* Chat Header */}
      <div className="border-b bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Messages</h2>
            <p className="text-sm text-muted-foreground">
              {messages.length === 0 ? 'No messages yet' : `${messages.length} messages`}
            </p>
          </div>
          {hasMoreMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-muted-foreground"
            >
              {isLoadingMore ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Load more
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1"
        onScroll={handleScroll}
      >
        <div className="px-6 py-4">
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
                    
                    {/* Retry button for failed messages */}
                    {message.status === 'failed' && isOwnMessage && (
                      <div className="flex justify-end -mt-2 mb-2 px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetryMessage(message.id)}
                          className="text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive/10 h-6"
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

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <Button
          variant="secondary"
          size="sm"
          className={cn(
            "absolute bottom-6 right-6 rounded-full shadow-lg border",
            "transition-all duration-200 ease-in-out",
            "hover:scale-105 bg-background/80 backdrop-blur-sm"
          )}
          onClick={() => scrollToBottom()}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}