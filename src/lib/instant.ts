import { init, tx, id } from '@instantdb/react';
import type { User, Message, TypingStatus } from '../types';

// Initialize instant-db
const db = init({
  appId: import.meta.env.VITE_INSTANT_APP_ID || 'your-app-id',
});

// Connection management utilities
export const connectionManager = {
  // Check if database is connected
  isConnected: () => {
    try {
      // This will be implemented based on instant-db connection status
      return true; // Placeholder
    } catch {
      return false;
    }
  },

  // Get connection status
  getStatus: () => ({
    isConnected: connectionManager.isConnected(),
    timestamp: new Date(),
  }),
};

// Helper functions for database operations
export const dbHelpers = {
  // Generate unique IDs
  generateId: () => id(),
  
  // Transaction helper
  transaction: tx,
  
  // User operations
  users: {
    create: (userData: Omit<User, 'id'>) => ({
      id: id(),
      ...userData,
      joinedAt: new Date(),
      lastSeen: new Date(),
    }),
    
    updateOnlineStatus: (userId: string, isOnline: boolean) => 
      tx.users[userId].update({
        isOnline,
        lastSeen: new Date(),
      }),
  },
  
  // Message operations
  messages: {
    create: (messageData: Omit<Message, 'id' | 'timestamp'>) => ({
      id: id(),
      ...messageData,
      timestamp: new Date(),
    }),
    
    updateStatus: (messageId: string, status: Message['status']) =>
      tx.messages[messageId].update({ status }),

    send: async (content: string, senderId: string, senderAlias: string) => {
      const messageId = id();
      const message = {
        id: messageId,
        content: content.trim(),
        senderId,
        senderAlias,
        timestamp: new Date(),
        status: 'sending' as const,
      };

      try {
        // Optimistic update - add message with sending status
        await db.transact([tx.messages[messageId].update(message)]);
        
        // Simulate network delay for status update
        setTimeout(async () => {
          try {
            // Update status to delivered after successful persistence
            await db.transact([
              tx.messages[messageId].update({ status: 'delivered' })
            ]);
          } catch (error) {
            console.error('Failed to update message status to delivered:', error);
            // Update status to failed if delivery confirmation fails
            await db.transact([
              tx.messages[messageId].update({ status: 'failed' })
            ]);
          }
        }, 500); // Small delay to show sending status
        
        return message;
      } catch (error) {
        console.error('Failed to send message:', error);
        // Update status to failed if initial send fails
        try {
          await db.transact([
            tx.messages[messageId].update({ status: 'failed' })
          ]);
        } catch (updateError) {
          console.error('Failed to update message status to failed:', updateError);
        }
        throw error;
      }
    },

    retry: async (messageId: string) => {
      try {
        // Update status to sending
        await db.transact([
          tx.messages[messageId].update({ 
            status: 'sending',
            timestamp: new Date() // Update timestamp for retry
          })
        ]);

        // Simulate retry delay
        setTimeout(async () => {
          try {
            // Update status to delivered after successful retry
            await db.transact([
              tx.messages[messageId].update({ status: 'delivered' })
            ]);
          } catch (error) {
            console.error('Failed to retry message:', error);
            // Update status back to failed if retry fails
            await db.transact([
              tx.messages[messageId].update({ status: 'failed' })
            ]);
            throw error;
          }
        }, 1000); // Longer delay for retry to simulate network recovery
        
      } catch (error) {
        console.error('Failed to retry message:', error);
        // Ensure status is set to failed
        await db.transact([
          tx.messages[messageId].update({ status: 'failed' })
        ]);
        throw error;
      }
    },
  },
  
  // Typing status operations
  typingStatus: {
    update: async (userId: string, isTyping: boolean, userAlias: string) => {
      const typingData = {
        userId,
        userAlias,
        isTyping,
        lastTypingTime: new Date(),
      };

      try {
        await db.transact([tx.typingStatus[userId].merge(typingData)]);
      } catch (error) {
        console.error('Failed to update typing status:', error);
      }
    },
  },
};

// Query helpers for common database operations
export const queries = {
  // Get all online users
  onlineUsers: () => ({
    users: {
      $: {
        where: { isOnline: true },
        order: { joinedAt: 'asc' as const },
      },
    },
  }),

  // Get recent messages with pagination
  recentMessages: (limit = 50, before?: Date) => ({
    messages: {
      $: {
        where: before ? { timestamp: { $lt: before } } : {},
        order: { timestamp: 'desc' as const },
        limit,
      },
    },
  }),

  // Get currently typing users
  typingUsers: () => ({
    typingStatus: {
      $: {
        where: { isTyping: true },
        order: { lastTypingTime: 'desc' as const },
      },
    },
  }),

  // Get all data for chat interface
  chatData: () => ({
    users: {
      $: {
        order: { joinedAt: 'asc' as const },
      },
    },
    messages: {
      $: {
        order: { timestamp: 'asc' as const },
        limit: 100, // Load last 100 messages initially
      },
    },
    typingStatus: {
      $: {
        where: { isTyping: true },
      },
    },
  }),
};

export { db };
export type { User, Message, TypingStatus };