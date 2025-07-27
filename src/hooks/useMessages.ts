import { useState, useEffect, useCallback } from 'react';
import { db, queries, dbHelpers } from '../lib/instant';
import type { Message, User } from '../types';

interface UseMessagesOptions {
  currentUser: User | null;
  initialLimit?: number;
}

interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  hasMoreMessages: boolean;
  sendMessage: (content: string) => Promise<void>;
  loadMoreMessages: () => void;
  retryFailedMessage: (messageId: string) => Promise<void>;
}

export function useMessages({
  currentUser,
  initialLimit = 50
}: UseMessagesOptions): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Subscribe to messages from instant-db
  const { data, isLoading: dbLoading, error: dbError } = db.useQuery(
    queries.chatData()
  );

  // Update local state when data changes
  useEffect(() => {
    if (data?.messages) {
      const sortedMessages = [...data.messages].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(sortedMessages);
      setHasMoreMessages(sortedMessages.length >= initialLimit);
    }
    setIsLoading(dbLoading);
    setError(dbError ? 'Failed to load messages' : null);
  }, [data, dbLoading, dbError, initialLimit]);

  // Send a new message
  const sendMessage = useCallback(async (content: string) => {
    if (!currentUser || !content.trim()) {
      return;
    }

    try {
      await dbHelpers.messages.send(
        content.trim(),
        currentUser.id,
        currentUser.alias
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    }
  }, [currentUser]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMoreMessages || messages.length === 0) {
      return;
    }

    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const olderMessagesQuery = queries.recentMessages(
        initialLimit,
        new Date(oldestMessage.timestamp)
      );

      const { data: olderData } = await db.query(olderMessagesQuery);

      if (olderData?.messages && olderData.messages.length > 0) {
        const sortedOlderMessages = [...olderData.messages].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setMessages(prev => [...sortedOlderMessages, ...prev]);
        setHasMoreMessages(olderData.messages.length >= initialLimit);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
      setError('Failed to load older messages');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreMessages, messages, initialLimit]);

  // Retry a failed message
  const retryFailedMessage = useCallback(async (messageId: string) => {
    const failedMessage = messages.find(m => m.id === messageId);
    if (!failedMessage || !currentUser) {
      return;
    }

    try {
      // Update message status to sending
      await db.transact([
        dbHelpers.messages.updateStatus(messageId, 'sending')
      ]);

      // Try to send again
      await dbHelpers.messages.send(
        failedMessage.content,
        currentUser.id,
        currentUser.alias
      );
    } catch (err) {
      console.error('Failed to retry message:', err);
      // Update status back to failed
      await db.transact([
        dbHelpers.messages.updateStatus(messageId, 'failed')
      ]);
      setError('Failed to retry message. Please try again.');
    }
  }, [messages, currentUser]);

  return {
    messages,
    isLoading,
    error,
    hasMoreMessages,
    sendMessage,
    loadMoreMessages,
    retryFailedMessage,
  };
}