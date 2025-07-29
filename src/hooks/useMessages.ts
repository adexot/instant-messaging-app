import { useState, useEffect, useCallback } from 'react';
import { db, queries, dbHelpers } from '../lib/instant';
import { useConnection } from './useConnection';
import { useOfflineQueue } from './useOfflineQueue';
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

  // Connection and offline queue management
  const { status: connectionStatus } = useConnection();
  const { queuedMessages, addToQueue, processQueue } = useOfflineQueue();

  // Subscribe to messages from instant-db
  const { data, isLoading: dbLoading, error: dbError } = db.useQuery(
    queries.chatData()
  );

  // Update local state when data changes
  useEffect(() => {
    if (data?.messages) {
      const sortedMessages = [...(data.messages as Message[])].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(sortedMessages);
      setHasMoreMessages(sortedMessages.length >= initialLimit);
    }
    setIsLoading(dbLoading);
    setError(dbError ? 'Failed to load messages' : null);
  }, [data, dbLoading, dbError, initialLimit]);

  // Send a new message with offline support
  const sendMessage = useCallback(async (content: string) => {
    if (!currentUser || !content.trim()) {
      return;
    }

    const messageId = dbHelpers.generateId();
    const messageData = {
      id: messageId,
      content: content.trim(),
      senderId: currentUser.id,
      senderAlias: currentUser.alias,
      timestamp: new Date(),
    };

    // If offline, add to queue
    if (connectionStatus !== 'connected') {
      addToQueue(messageData);
      console.log('Message queued for offline sending:', messageId);
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
      
      // Add to offline queue if send fails
      addToQueue(messageData);
      setError('Message queued for retry when connection is restored.');
    }
  }, [currentUser, connectionStatus, addToQueue]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMoreMessages || messages.length === 0) {
      return;
    }

    setLoadingMore(true);
    try {
      // For now, just disable pagination until we implement proper instant-db pagination
      setHasMoreMessages(false);
    } catch (err) {
      console.error('Failed to load more messages:', err);
      setError('Failed to load older messages');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreMessages, messages]);

  // Retry a failed message
  const retryFailedMessage = useCallback(async (messageId: string) => {
    const failedMessage = messages.find(m => m.id === messageId);
    if (!failedMessage || !currentUser) {
      return;
    }

    try {
      await dbHelpers.messages.retry(messageId);
      // Clear any previous error
      setError(null);
    } catch (err) {
      console.error('Failed to retry message:', err);
      setError('Failed to retry message. Please try again.');
    }
  }, [messages, currentUser]);

  // Process offline queue when connection is restored
  useEffect(() => {
    if (connectionStatus === 'connected' && queuedMessages.length > 0) {
      console.log('Connection restored, processing offline queue...');
      
      processQueue(async (queuedMessage) => {
        await dbHelpers.messages.send(
          queuedMessage.content,
          queuedMessage.senderId,
          queuedMessage.senderAlias
        );
      });
    }
  }, [connectionStatus, queuedMessages.length, processQueue]);

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