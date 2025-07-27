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
      const message = dbHelpers.messages.create({
        content: content.trim(),
        senderId,
        senderAlias,
        status: 'sending' as const,
      });

      try {
        await db.transact([tx.messages[message.id].update(message)]);
        // Update status to delivered after successful send
        await db.transact([
          tx.messages[message.id].update({ status: 'delivered' })
        ]);
        return message;
      } catch (error) {
        // Update status to failed if send fails
        await db.transact([
          tx.messages[message.id].update({ status: 'failed' })
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
        order: { by: 'joinedAt', direction: 'asc' as const },
      },
    },
  }),

  // Get recent messages with pagination
  recentMessages: (limit = 50, before?: Date) => ({
    messages: {
      $: {
        where: before ? { timestamp: { $lt: before } } : {},
        order: { by: 'timestamp', direction: 'desc' as const },
        limit,
      },
    },
  }),

  // Get currently typing users
  typingUsers: () => ({
    typingStatus: {
      $: {
        where: { isTyping: true },
        order: { by: 'lastTypingTime', direction: 'desc' as const },
      },
    },
  }),

  // Get all data for chat interface
  chatData: () => ({
    users: {
      $: {
        order: { by: 'joinedAt', direction: 'asc' as const },
      },
    },
    messages: {
      $: {
        order: { by: 'timestamp', direction: 'asc' as const },
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