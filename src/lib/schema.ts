import type { User, Message, TypingStatus } from '@/types';

// Define the instant-db schema structure
export type InstantSchema = {
  users: User;
  messages: Message;
  typingStatus: TypingStatus;
};

// Schema validation rules for instant-db
export const schemaRules = {
  users: {
    // Unique constraint on alias
    alias: { unique: true },
    // Required fields
    required: ['id', 'alias', 'isOnline', 'lastSeen', 'joinedAt'],
  },
  messages: {
    // Index on timestamp for efficient querying
    timestamp: { index: true },
    // Index on senderId for user message history
    senderId: { index: true },
    // Required fields
    required: ['id', 'content', 'senderId', 'senderAlias', 'timestamp', 'status'],
  },
  typingStatus: {
    // Primary key is userId for upsert operations
    userId: { primary: true },
    // Auto-cleanup old typing status records
    lastTypingTime: { index: true },
    // Required fields
    required: ['userId', 'userAlias', 'isTyping', 'lastTypingTime'],
  },
} as const;

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

  // Get messages for a specific user
  userMessages: (userId: string, limit = 50) => ({
    messages: {
      $: {
        where: { senderId: userId },
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
} as const;