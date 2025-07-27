// Core data models for the instant messaging app

export interface User {
  id: string;
  alias: string;
  isOnline: boolean;
  lastSeen: Date;
  joinedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderAlias: string;
  timestamp: Date;
  status: 'sending' | 'delivered' | 'failed';
}

export interface TypingStatus {
  userId: string;
  userAlias: string;
  isTyping: boolean;
  lastTypingTime: Date;
}

// Validation and form types
export interface AliasValidation {
  isValid: boolean;
  error?: string;
  isChecking?: boolean;
}

export interface MessageValidation {
  isValid: boolean;
  error?: string;
  trimmedContent: string;
}

// UI State types
export interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected?: Date;
  error?: string;
}

export interface ChatState {
  users: User[];
  messages: Message[];
  typingUsers: TypingStatus[];
  currentUser: User | null;
  connectionStatus: ConnectionStatus;
}

// Form input types
export interface AliasFormData {
  alias: string;
}

export interface MessageFormData {
  content: string;
}

// Event types for real-time updates
export type UserEvent = 
  | { type: 'user_joined'; user: User }
  | { type: 'user_left'; userId: string }
  | { type: 'user_online_status_changed'; userId: string; isOnline: boolean };

export type MessageEvent = 
  | { type: 'message_sent'; message: Message }
  | { type: 'message_status_updated'; messageId: string; status: Message['status'] };

export type TypingEvent = 
  | { type: 'typing_started'; typingStatus: TypingStatus }
  | { type: 'typing_stopped'; userId: string };

// Constants
export const ALIAS_CONSTRAINTS = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 20,
  PATTERN: /^[a-zA-Z0-9_-]+$/,
} as const;

export const MESSAGE_CONSTRAINTS = {
  MAX_LENGTH: 1000,
  MIN_LENGTH: 1,
} as const;

export const TYPING_TIMEOUT = 3000; // 3 seconds