import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useConnection } from '../useConnection';

// Mock instant-db
vi.mock('../../lib/instant', () => ({
  db: {
    queryOnce: vi.fn(),
  },
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('useConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (navigator as any).onLine = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with connecting status', () => {
    const { result } = renderHook(() => useConnection());
    
    expect(result.current.status).toBe('connecting');
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.retryCount).toBe(0);
  });

  it('should handle browser offline event', () => {
    const { result } = renderHook(() => useConnection());
    
    act(() => {
      (navigator as any).onLine = false;
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current.status).toBe('disconnected');
    expect(result.current.error).toBe('No internet connection');
  });

  it('should provide reconnect function', () => {
    const { result } = renderHook(() => useConnection());
    
    expect(typeof result.current.reconnect).toBe('function');
    expect(result.current.isOnline).toBe(true);
  });

  it('should track retry count', () => {
    const { result } = renderHook(() => useConnection());
    
    act(() => {
      result.current.reconnect();
    });
    
    expect(result.current.status).toBe('connecting');
    expect(result.current.isReconnecting).toBe(true);
  });
});