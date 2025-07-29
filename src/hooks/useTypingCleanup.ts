import { useEffect, useRef } from 'react';
import { dbHelpers } from '../lib/instant';

interface UseTypingCleanupOptions {
  intervalMs?: number;
  maxAgeMs?: number;
  enabled?: boolean;
}

/**
 * Hook to periodically clean up old typing status records
 * This prevents the database from accumulating stale typing indicators
 */
export function useTypingCleanup({
  intervalMs = 30000, // Clean up every 30 seconds
  maxAgeMs = 60000,   // Remove records older than 1 minute
  enabled = true
}: UseTypingCleanupOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const cleanup = async () => {
      try {
        await dbHelpers.typingStatus.cleanup(maxAgeMs);
      } catch (error) {
        console.error('Typing status cleanup failed:', error);
      }
    };

    // Run initial cleanup
    cleanup();

    // Set up periodic cleanup
    intervalRef.current = setInterval(cleanup, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMs, maxAgeMs, enabled]);

  // Manual cleanup function
  const manualCleanup = async () => {
    try {
      await dbHelpers.typingStatus.cleanup(maxAgeMs);
    } catch (error) {
      console.error('Manual typing status cleanup failed:', error);
    }
  };

  return { manualCleanup };
}