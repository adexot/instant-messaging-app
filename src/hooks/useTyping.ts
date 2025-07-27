import { useState, useEffect, useCallback, useRef } from 'react';
import { db, queries, dbHelpers } from '../lib/instant';
import type { TypingStatus, User } from '../types';
import { TYPING_TIMEOUT } from '../types';

interface UseTypingOptions {
  currentUser: User | null;
}

interface UseTypingReturn {
  typingUsers: TypingStatus[];
  startTyping: () => void;
  stopTyping: () => void;
  isLoading: boolean;
  error: string | null;
}

export function useTyping({ currentUser }: UseTypingOptions): UseTypingReturn {
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isCurrentlyTyping = useRef(false);

  // Subscribe to typing status from instant-db
  const { data, isLoading: dbLoading, error: dbError } = db.useQuery(
    queries.typingUsers()
  );

  // Update local state when typing data changes
  useEffect(() => {
    if (data?.typingStatus) {
      // Filter out current user and expired typing statuses
      const now = new Date();
      const activeTypingUsers = (data.typingStatus as unknown as TypingStatus[]).filter((status: TypingStatus) => {
        const isNotCurrentUser = currentUser ? status.userId !== currentUser.id : true;
        const isRecent = now.getTime() - new Date(status.lastTypingTime).getTime() < TYPING_TIMEOUT;
        return isNotCurrentUser && status.isTyping && isRecent;
      });

      setTypingUsers(activeTypingUsers);
    }
    setIsLoading(dbLoading);
    setError(dbError ? 'Failed to load typing status' : null);
  }, [data, dbLoading, dbError, currentUser]);

  // Start typing indicator
  const startTyping = useCallback(async () => {
    if (!currentUser || isCurrentlyTyping.current) {
      return;
    }

    try {
      isCurrentlyTyping.current = true;
      await dbHelpers.typingStatus.update(
        currentUser.id,
        true,
        currentUser.alias
      );

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to automatically stop typing
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, TYPING_TIMEOUT);

    } catch (err) {
      console.error('Failed to start typing indicator:', err);
      setError('Failed to update typing status');
      isCurrentlyTyping.current = false;
    }
  }, [currentUser]);

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!currentUser || !isCurrentlyTyping.current) {
      return;
    }

    try {
      isCurrentlyTyping.current = false;
      await dbHelpers.typingStatus.update(
        currentUser.id,
        false,
        currentUser.alias
      );

      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = undefined;
      }

    } catch (err) {
      console.error('Failed to stop typing indicator:', err);
      setError('Failed to update typing status');
    }
  }, [currentUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing when component unmounts
      if (isCurrentlyTyping.current && currentUser) {
        dbHelpers.typingStatus.update(currentUser.id, false, currentUser.alias);
      }
    };
  }, [currentUser]);

  // Auto-cleanup expired typing statuses
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setTypingUsers(prev => {
        const now = new Date();
        return prev.filter(status => {
          const isRecent = now.getTime() - new Date(status.lastTypingTime).getTime() < TYPING_TIMEOUT;
          return isRecent;
        });
      });
    }, 1000); // Check every second

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    isLoading,
    error,
  };
}