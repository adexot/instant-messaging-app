import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import { MessageBubble } from './MessageBubble';
import type { Message, User } from '../types';

interface VirtualMessageListProps {
  messages: Message[];
  currentUser: User;
  height: number;
  onRetryFailedMessage?: (messageId: string) => void;
}

interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: Message[];
    currentUser: User;
    onRetryFailedMessage?: (messageId: string) => void;
  };
}

const MessageItem = React.memo(({ index, style, data }: MessageItemProps) => {
  const { messages, currentUser, onRetryFailedMessage } = data;
  const message = messages[index];
  const isOwnMessage = message.senderId === currentUser.id;

  return (
    <div style={style} className="px-3 sm:px-6">
      <div className="py-1">
        <MessageBubble
          message={message}
          isOwnMessage={isOwnMessage}
          showTimestamp={true}
        />
        
        {/* Retry button for failed messages */}
        {message.status === 'failed' && isOwnMessage && onRetryFailedMessage && (
          <div className="flex justify-end -mt-2 mb-2 px-3">
            <button
              onClick={() => onRetryFailedMessage(message.id)}
              className="text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive/10 px-2 py-1 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export const VirtualMessageList = React.memo(({
  messages,
  currentUser,
  height,
  onRetryFailedMessage,
}: VirtualMessageListProps) => {
  const listRef = useRef<List>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const previousMessageCount = useRef(messages.length);

  // Estimate item size based on message content
  const getItemSize = useCallback((index: number) => {
    const message = messages[index];
    if (!message) return 80;

    // Base height for message bubble
    let itemHeight = 60;
    
    // Add height based on content length (rough estimation)
    const lines = Math.ceil(message.content.length / 50);
    itemHeight += lines * 20;
    
    // Add extra height for failed messages (retry button)
    if (message.status === 'failed' && message.senderId === currentUser.id) {
      itemHeight += 30;
    }
    
    return Math.min(itemHeight, 200); // Cap at reasonable max height
  }, [messages, currentUser.id]);

  // Memoize the data object to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    messages,
    currentUser,
    onRetryFailedMessage,
  }), [messages, currentUser, onRetryFailedMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > previousMessageCount.current && shouldScrollToBottom) {
      listRef.current?.scrollToItem(messages.length - 1, 'end');
    }
    previousMessageCount.current = messages.length;
  }, [messages.length, shouldScrollToBottom]);

  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: any) => {
    if (!scrollUpdateWasRequested) {
      // User manually scrolled, check if they're near the bottom
      // For virtual scrolling, we'll use a simpler approach to detect bottom
      const totalHeight = messages.reduce((acc, _, index) => acc + getItemSize(index), 0);
      const distanceFromBottom = totalHeight - scrollOffset - height;
      setShouldScrollToBottom(distanceFromBottom < 100);
    }
  }, [messages, height, getItemSize]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
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
    );
  }

  return (
    <List
      ref={listRef}
      height={height}
      width="100%"
      itemCount={messages.length}
      itemSize={getItemSize}
      itemData={itemData}
      onScroll={handleScroll}
      className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
    >
      {MessageItem}
    </List>
  );
});

VirtualMessageList.displayName = 'VirtualMessageList';