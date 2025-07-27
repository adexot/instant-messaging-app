import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@instantdb/react';
import { db, dbHelpers, queries } from '@/lib/instant';
import type { User } from '@/types';

export interface UseUserManagementReturn {
  currentUser: User | null;
  onlineUsers: User[];
  userCount: number;
  isLoading: boolean;
  error: string | null;
  joinChat: (alias: string) => Promise<void>;
  leaveChat: () => Promise<void>;
  checkAliasUniqueness: (alias: string) => Promise<boolean>;
}

export function useUserManagement(): UseUserManagementReturn {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query online users with real-time updates
  const { data, isLoading: queryLoading, error: queryError } = useQuery(queries.onlineUsers());
  
  const onlineUsers = data?.users || [];
  const userCount = onlineUsers.length;

  // Handle window/tab close to mark user offline
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentUser) {
        // Mark user as offline when leaving
        db.transact([
          dbHelpers.users.updateOnlineStatus(currentUser.id, false)
        ]).catch(console.error);
      }
    };

    const handleVisibilityChange = () => {
      if (currentUser) {
        const isOnline = !document.hidden;
        db.transact([
          dbHelpers.users.updateOnlineStatus(currentUser.id, isOnline)
        ]).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser]);

  // Periodic heartbeat to maintain online status
  useEffect(() => {
    if (!currentUser) return;

    const heartbeatInterval = setInterval(() => {
      db.transact([
        dbHelpers.users.updateOnlineStatus(currentUser.id, true)
      ]).catch(console.error);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [currentUser]);

  const checkAliasUniqueness = useCallback(async (alias: string): Promise<boolean> => {
    try {
      const { data } = await db.queryOnce({
        users: {
          $: {
            where: { alias: alias.toLowerCase().trim() }
          }
        }
      });

      return !data?.users || data.users.length === 0;
    } catch (error) {
      console.error('Error checking alias uniqueness:', error);
      throw new Error('Unable to verify alias availability');
    }
  }, []);

  const joinChat = useCallback(async (alias: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if alias is unique
      const isUnique = await checkAliasUniqueness(alias);
      if (!isUnique) {
        throw new Error('This alias is already taken');
      }

      // Create new user
      const newUser = dbHelpers.users.create({
        alias: alias.toLowerCase().trim(),
        isOnline: true,
      });

      // Save user to database
      await db.transact([
        db.tx.users[newUser.id].update(newUser)
      ]);

      setCurrentUser(newUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join chat';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [checkAliasUniqueness]);

  const leaveChat = useCallback(async (): Promise<void> => {
    if (!currentUser) return;

    try {
      // Mark user as offline
      await db.transact([
        dbHelpers.users.updateOnlineStatus(currentUser.id, false)
      ]);

      setCurrentUser(null);
    } catch (error) {
      console.error('Error leaving chat:', error);
      // Still clear current user even if database update fails
      setCurrentUser(null);
    }
  }, [currentUser]);

  return {
    currentUser,
    onlineUsers,
    userCount,
    isLoading: isLoading || queryLoading,
    error: error || (queryError ? 'Failed to load users' : null),
    joinChat,
    leaveChat,
    checkAliasUniqueness,
  };
}