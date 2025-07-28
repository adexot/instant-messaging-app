import { useState, useEffect, useCallback } from 'react';
import { db, dbHelpers, queries } from '../lib/instant';
import type { User } from '../types';

// Session storage keys
const SESSION_KEYS = {
  CURRENT_USER: 'instant-messaging-current-user',
  SESSION_ID: 'instant-messaging-session-id',
} as const;

// Session management utilities
const sessionManager = {
  saveSession: (user: User, sessionId: string) => {
    try {
      localStorage.setItem(SESSION_KEYS.CURRENT_USER, JSON.stringify(user));
      localStorage.setItem(SESSION_KEYS.SESSION_ID, sessionId);
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }
  },

  loadSession: (): { user: User; sessionId: string } | null => {
    try {
      const userStr = localStorage.getItem(SESSION_KEYS.CURRENT_USER);
      const sessionId = localStorage.getItem(SESSION_KEYS.SESSION_ID);
      
      if (!userStr || !sessionId) return null;
      
      const user = JSON.parse(userStr);
      // Convert date strings back to Date objects
      user.joinedAt = new Date(user.joinedAt);
      user.lastSeen = new Date(user.lastSeen);
      
      return { user, sessionId };
    } catch (error) {
      console.warn('Failed to load session from localStorage:', error);
      return null;
    }
  },

  clearSession: () => {
    try {
      localStorage.removeItem(SESSION_KEYS.CURRENT_USER);
      localStorage.removeItem(SESSION_KEYS.SESSION_ID);
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error);
    }
  },

  generateSessionId: () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};

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
  const [isLoading, setIsLoading] = useState(true); // Start with loading true for session restoration
  const [error, setError] = useState<string | null>(null);
  // @ts-ignore - sessionId is used for session tracking
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Query online users with real-time updates
  const { data, isLoading: queryLoading, error: queryError } = db.useQuery(queries.onlineUsers());
  
  const onlineUsers = (data?.users as User[]) || [];
  // Sort users by joinedAt since instant-db can't order by non-indexed fields
  const sortedOnlineUsers = [...onlineUsers].sort((a, b) => 
    new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  );
  const userCount = sortedOnlineUsers.length;

  // Session restoration on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = sessionManager.loadSession();
        if (!session) {
          setIsLoading(false);
          return;
        }

        const { user, sessionId: storedSessionId } = session;
        
        // Check if user still exists in database and restore session
        const { data } = await db.queryOnce({
          users: {
            $: {
              where: { id: user.id }
            }
          }
        });

        if (data?.users && data.users.length > 0) {
          // User exists, restore session and mark as online
          await db.transact([
            dbHelpers.users.updateOnlineStatus(user.id, true)
          ]);
          
          setCurrentUser(user);
          setSessionId(storedSessionId);
        } else {
          // User doesn't exist anymore, clear session
          sessionManager.clearSession();
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        sessionManager.clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

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

  // Periodic cleanup of old inactive users (only for the first user to avoid multiple cleanups)
  useEffect(() => {
    if (!currentUser) return;

    const cleanupInterval = setInterval(async () => {
      try {
        // Get all offline users
        const { data } = await db.queryOnce({
          users: {
            $: {
              where: { isOnline: false }
            }
          }
        });

        if (data?.users) {
          const now = new Date();
          const CLEANUP_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
          
          // Find users who have been offline for more than 24 hours
          const usersToCleanup = (data.users as User[]).filter((user: User) => {
            const lastSeen = new Date(user.lastSeen);
            return now.getTime() - lastSeen.getTime() > CLEANUP_THRESHOLD;
          });

          // Remove old inactive users
          if (usersToCleanup.length > 0) {
            const deleteTransactions = usersToCleanup.map((user: User) => 
              db.tx.users[user.id].delete()
            );
            
            await db.transact(deleteTransactions);
            console.log(`Cleaned up ${usersToCleanup.length} inactive users`);
          }
        }
      } catch (error) {
        console.error('Failed to cleanup inactive users:', error);
      }
    }, 5 * 60 * 1000); // Run cleanup every 5 minutes

    return () => clearInterval(cleanupInterval);
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

      if (!data?.users || data.users.length === 0) {
        return true; // Alias is available
      }

      // Check if any of the users with this alias are currently online
      const onlineUsersWithAlias = (data.users as User[]).filter((user: User) => user.isOnline);
      
      // If no online users have this alias, it's available for use
      // This allows rejoining with the same alias after being offline
      return onlineUsersWithAlias.length === 0;
    } catch (error) {
      console.error('Error checking alias uniqueness:', error);
      throw new Error('Unable to verify alias availability');
    }
  }, []);

  const joinChat = useCallback(async (alias: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const trimmedAlias = alias.toLowerCase().trim();
      
      // Check if alias is available
      const isAvailable = await checkAliasUniqueness(trimmedAlias);
      if (!isAvailable) {
        throw new Error('This alias is already taken by an online user');
      }

      // Check if there's an existing offline user with this alias that we can reuse
      const { data } = await db.queryOnce({
        users: {
          $: {
            where: { alias: trimmedAlias }
          }
        }
      });

      let user: User;
      let newSessionId = sessionManager.generateSessionId();

      if (data?.users && data.users.length > 0) {
        // Reuse existing offline user
        const existingUser = data.users[0] as User;
        user = {
          ...existingUser,
          isOnline: true,
          lastSeen: new Date(),
          // Keep original joinedAt date
        };

        // Update existing user to online
        await db.transact([
          db.tx.users[user.id].update({
            isOnline: true,
            lastSeen: new Date(),
          })
        ]);
      } else {
        // Create new user
        user = dbHelpers.users.create({
          alias: trimmedAlias,
          isOnline: true,
          lastSeen: new Date(),
          joinedAt: new Date(),
        });

        // Save new user to database
        await db.transact([
          db.tx.users[user.id].update(user)
        ]);
      }

      // Save session and update state
      sessionManager.saveSession(user, newSessionId);
      setCurrentUser(user);
      setSessionId(newSessionId);
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

      // Clear session storage
      sessionManager.clearSession();
      
      setCurrentUser(null);
      setSessionId(null);
    } catch (error) {
      console.error('Error leaving chat:', error);
      // Still clear current user and session even if database update fails
      sessionManager.clearSession();
      setCurrentUser(null);
      setSessionId(null);
    }
  }, [currentUser]);

  return {
    currentUser,
    onlineUsers: sortedOnlineUsers,
    userCount,
    isLoading: isLoading || queryLoading,
    error: error || (queryError ? 'Failed to load users' : null),
    joinChat,
    leaveChat,
    checkAliasUniqueness,
  };
}