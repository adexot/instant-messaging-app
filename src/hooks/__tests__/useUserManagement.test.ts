import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock instant-db
vi.mock('@instantdb/react', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/lib/instant', () => ({
  db: {
    transact: vi.fn(),
    queryOnce: vi.fn(),
    tx: {
      users: new Proxy({}, {
        get: () => ({
          update: vi.fn(),
          merge: vi.fn(),
        })
      })
    }
  },
  dbHelpers: {
    users: {
      create: vi.fn(),
      updateOnlineStatus: vi.fn(),
    },
  },
  queries: {
    onlineUsers: vi.fn(),
  },
}));

import { useUserManagement } from '../useUserManagement';

// Get the mocked modules
const { useQuery } = await import('@instantdb/react');
const { db, dbHelpers, queries } = await import('@/lib/instant');

const mockedUseQuery = vi.mocked(useQuery);
const mockedDb = vi.mocked(db);
const mockedDbHelpers = vi.mocked(dbHelpers);
const mockedQueries = vi.mocked(queries);

describe('useUserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mocked functions
    mockedUseQuery.mockReturnValue({
      data: { users: [] },
      isLoading: false,
      error: null,
    });
    
    mockedDb.transact.mockResolvedValue(undefined);
    mockedDb.queryOnce.mockResolvedValue({ data: { users: [] } });
    
    mockedDbHelpers.users.create.mockImplementation((userData: any) => ({
      id: 'test-user-id',
      ...userData,
      joinedAt: new Date('2024-01-01T00:00:00Z'),
      lastSeen: new Date('2024-01-01T00:00:00Z'),
    }));
    
    mockedDbHelpers.users.updateOnlineStatus.mockImplementation((userId: string, isOnline: boolean) => ({
      type: 'update',
      userId,
      isOnline,
      lastSeen: new Date(),
    }));
    
    mockedQueries.onlineUsers.mockReturnValue({ users: { $: { where: { isOnline: true } } } });
    
    // Mock window events
    Object.defineProperty(window, 'addEventListener', {
      value: vi.fn(),
      writable: true,
    });
    Object.defineProperty(window, 'removeEventListener', {
      value: vi.fn(),
      writable: true,
    });
    Object.defineProperty(document, 'addEventListener', {
      value: vi.fn(),
      writable: true,
    });
    Object.defineProperty(document, 'removeEventListener', {
      value: vi.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useUserManagement());

    expect(result.current.currentUser).toBeNull();
    expect(result.current.onlineUsers).toEqual([]);
    expect(result.current.userCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load online users from database', () => {
    const mockUsers = [
      {
        id: 'user1',
        alias: 'testuser1',
        isOnline: true,
        joinedAt: new Date(),
        lastSeen: new Date(),
      },
      {
        id: 'user2',
        alias: 'testuser2',
        isOnline: true,
        joinedAt: new Date(),
        lastSeen: new Date(),
      },
    ];

    mockedUseQuery.mockReturnValue({
      data: { users: mockUsers },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useUserManagement());

    expect(result.current.onlineUsers).toEqual(mockUsers);
    expect(result.current.userCount).toBe(2);
  });

  it('should check alias uniqueness correctly', async () => {
    mockedDb.queryOnce.mockResolvedValueOnce({ data: { users: [] } });

    const { result } = renderHook(() => useUserManagement());

    await act(async () => {
      const isUnique = await result.current.checkAliasUniqueness('newuser');
      expect(isUnique).toBe(true);
    });

    expect(mockedDb.queryOnce).toHaveBeenCalledWith({
      users: {
        $: {
          where: { alias: 'newuser' }
        }
      }
    });
  });

  it('should detect non-unique alias', async () => {
    mockedDb.queryOnce.mockResolvedValueOnce({
      data: {
        users: [{ id: 'existing-user', alias: 'existinguser' }]
      }
    });

    const { result } = renderHook(() => useUserManagement());

    await act(async () => {
      const isUnique = await result.current.checkAliasUniqueness('existinguser');
      expect(isUnique).toBe(false);
    });
  });

  it('should handle alias uniqueness check errors', async () => {
    mockedDb.queryOnce.mockRejectedValueOnce(new Error('Database error'));

    const { result } = renderHook(() => useUserManagement());

    await act(async () => {
      await expect(
        result.current.checkAliasUniqueness('testuser')
      ).rejects.toThrow('Unable to verify alias availability');
    });
  });

  it('should join chat successfully', async () => {
    mockedDb.queryOnce.mockResolvedValueOnce({ data: { users: [] } });
    mockedDb.transact.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useUserManagement());

    await act(async () => {
      await result.current.joinChat('newuser');
    });

    expect(result.current.currentUser).toEqual({
      id: 'test-user-id',
      alias: 'newuser',
      isOnline: true,
      joinedAt: new Date('2024-01-01T00:00:00Z'),
      lastSeen: new Date('2024-01-01T00:00:00Z'),
    });

    expect(mockedDb.transact).toHaveBeenCalled();
  });

  it('should handle join chat with duplicate alias', async () => {
    mockedDb.queryOnce.mockResolvedValueOnce({
      data: {
        users: [{ id: 'existing-user', alias: 'existinguser' }]
      }
    });

    const { result } = renderHook(() => useUserManagement());

    await act(async () => {
      await expect(
        result.current.joinChat('existinguser')
      ).rejects.toThrow('This alias is already taken');
    });

    expect(result.current.currentUser).toBeNull();
    expect(result.current.error).toBe('This alias is already taken');
  });

  it('should handle join chat database errors', async () => {
    mockedDb.queryOnce.mockResolvedValueOnce({ data: { users: [] } });
    mockedDb.transact.mockRejectedValueOnce(new Error('Database error'));

    const { result } = renderHook(() => useUserManagement());

    await act(async () => {
      await expect(
        result.current.joinChat('newuser')
      ).rejects.toThrow('Database error');
    });

    expect(result.current.error).toBe('Database error');
  });

  it('should leave chat successfully', async () => {
    // First join a chat
    mockedDb.queryOnce.mockResolvedValueOnce({ data: { users: [] } });
    mockedDb.transact.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUserManagement());

    await act(async () => {
      await result.current.joinChat('testuser');
    });

    expect(result.current.currentUser).not.toBeNull();

    // Then leave the chat
    await act(async () => {
      await result.current.leaveChat();
    });

    expect(result.current.currentUser).toBeNull();
    expect(mockedDb.transact).toHaveBeenCalledTimes(2); // Once for join, once for leave
  });

  it('should handle leave chat when no current user', async () => {
    const { result } = renderHook(() => useUserManagement());

    await act(async () => {
      await result.current.leaveChat();
    });

    expect(result.current.currentUser).toBeNull();
    expect(mockedDb.transact).not.toHaveBeenCalled();
  });

  it('should set up window event listeners for presence tracking', () => {
    renderHook(() => useUserManagement());

    expect(window.addEventListener).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
    expect(document.addEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useUserManagement());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
  });

  it('should handle loading state from query', () => {
    mockedUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useUserManagement());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle query errors', () => {
    mockedUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Query failed'),
    });

    const { result } = renderHook(() => useUserManagement());

    expect(result.current.error).toBe('Failed to load users');
  });

  it('should normalize alias to lowercase and trim', async () => {
    mockedDb.queryOnce.mockResolvedValueOnce({ data: { users: [] } });
    mockedDb.transact.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useUserManagement());

    await act(async () => {
      await result.current.joinChat('  TestUser  ');
    });

    expect(result.current.currentUser?.alias).toBe('testuser');
  });
});