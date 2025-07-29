import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOfflineQueue } from '../useOfflineQueue';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useOfflineQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with empty queue', () => {
    const { result } = renderHook(() => useOfflineQueue());
    
    expect(result.current.queuedMessages).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
  });

  it('should load queued messages from localStorage on mount', () => {
    const storedMessages = [
      {
        id: '1',
        content: 'Test message',
        senderId: 'user1',
        senderAlias: 'User 1',
        timestamp: '2023-01-01T00:00:00.000Z',
        retryCount: 0,
      },
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedMessages));
    
    const { result } = renderHook(() => useOfflineQueue());
    
    expect(result.current.queuedMessages).toHaveLength(1);
    expect(result.current.queuedMessages[0].content).toBe('Test message');
    expect(result.current.queuedMessages[0].timestamp).toBeInstanceOf(Date);
  });

  it('should add message to queue', () => {
    const { result } = renderHook(() => useOfflineQueue());
    
    const message = {
      id: '1',
      content: 'Test message',
      senderId: 'user1',
      senderAlias: 'User 1',
      timestamp: new Date(),
    };
    
    act(() => {
      result.current.addToQueue(message);
    });
    
    expect(result.current.queuedMessages).toHaveLength(1);
    expect(result.current.queuedMessages[0]).toEqual({
      ...message,
      retryCount: 0,
    });
  });

  it('should save queue to localStorage when messages are added', () => {
    const { result } = renderHook(() => useOfflineQueue());
    
    const message = {
      id: '1',
      content: 'Test message',
      senderId: 'user1',
      senderAlias: 'User 1',
      timestamp: new Date(),
    };
    
    act(() => {
      result.current.addToQueue(message);
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'instant-messaging-offline-queue',
      expect.stringContaining('"content":"Test message"')
    );
  });

  it('should process queue successfully', async () => {
    const { result } = renderHook(() => useOfflineQueue());
    
    const message = {
      id: '1',
      content: 'Test message',
      senderId: 'user1',
      senderAlias: 'User 1',
      timestamp: new Date(),
    };
    
    act(() => {
      result.current.addToQueue(message);
    });
    
    const mockSendFunction = vi.fn().mockResolvedValue(undefined);
    
    await act(async () => {
      await result.current.processQueue(mockSendFunction);
    });
    
    expect(mockSendFunction).toHaveBeenCalledWith({
      ...message,
      retryCount: 0,
    });
    
    expect(result.current.queuedMessages).toHaveLength(0);
  });

  it('should retry failed messages up to max retry count', async () => {
    const { result } = renderHook(() => useOfflineQueue());
    
    const message = {
      id: '1',
      content: 'Test message',
      senderId: 'user1',
      senderAlias: 'User 1',
      timestamp: new Date(),
    };
    
    act(() => {
      result.current.addToQueue(message);
    });
    
    const mockSendFunction = vi.fn().mockRejectedValue(new Error('Send failed'));
    
    // First attempt should fail and increment retry count
    await act(async () => {
      await result.current.processQueue(mockSendFunction);
    });
    
    expect(result.current.queuedMessages).toHaveLength(1);
    expect(result.current.queuedMessages[0].retryCount).toBe(1);
    
    // Continue failing until max retries
    await act(async () => {
      await result.current.processQueue(mockSendFunction);
    });
    
    await act(async () => {
      await result.current.processQueue(mockSendFunction);
    });
    
    // After max retries, message should be removed
    await act(async () => {
      await result.current.processQueue(mockSendFunction);
    });
    
    expect(result.current.queuedMessages).toHaveLength(0);
  });

  it('should remove specific message from queue', () => {
    const { result } = renderHook(() => useOfflineQueue());
    
    const message1 = {
      id: '1',
      content: 'Test message 1',
      senderId: 'user1',
      senderAlias: 'User 1',
      timestamp: new Date(),
    };
    
    const message2 = {
      id: '2',
      content: 'Test message 2',
      senderId: 'user1',
      senderAlias: 'User 1',
      timestamp: new Date(),
    };
    
    act(() => {
      result.current.addToQueue(message1);
      result.current.addToQueue(message2);
    });
    
    expect(result.current.queuedMessages).toHaveLength(2);
    
    act(() => {
      result.current.removeFromQueue('1');
    });
    
    expect(result.current.queuedMessages).toHaveLength(1);
    expect(result.current.queuedMessages[0].id).toBe('2');
  });

  it('should clear entire queue', () => {
    const { result } = renderHook(() => useOfflineQueue());
    
    const message = {
      id: '1',
      content: 'Test message',
      senderId: 'user1',
      senderAlias: 'User 1',
      timestamp: new Date(),
    };
    
    act(() => {
      result.current.addToQueue(message);
    });
    
    expect(result.current.queuedMessages).toHaveLength(1);
    
    act(() => {
      result.current.clearQueue();
    });
    
    expect(result.current.queuedMessages).toHaveLength(0);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('instant-messaging-offline-queue');
  });
});