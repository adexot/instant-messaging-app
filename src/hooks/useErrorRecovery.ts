import { useState, useCallback, useRef } from 'react';
import { useToastHelpers } from '../components/ui/toast';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error, attempt: number) => void;
  onSuccess?: (attempt: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

interface ErrorRecoveryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
}

export function useErrorRecovery(options: ErrorRecoveryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onSuccess,
    onMaxRetriesReached,
  } = options;

  const [state, setState] = useState<ErrorRecoveryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });

  const toast = useToastHelpers();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const executeWithRetry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      operationName?: string
    ): Promise<T> => {
      let attempt = 0;
      let lastError: Error;

      while (attempt <= maxRetries) {
        try {
          setState(prev => ({
            ...prev,
            isRetrying: attempt > 0,
            retryCount: attempt,
          }));

          const result = await operation();

          // Success
          setState(prev => ({
            ...prev,
            isRetrying: false,
            retryCount: 0,
            lastError: null,
          }));

          if (attempt > 0 && onSuccess) {
            onSuccess(attempt);
          }

          if (attempt > 0) {
            toast.success(
              'Operation Successful',
              `${operationName || 'Operation'} completed after ${attempt} ${
                attempt === 1 ? 'retry' : 'retries'
              }`
            );
          }

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          attempt++;

          setState(prev => ({
            ...prev,
            lastError,
            retryCount: attempt,
          }));

          if (onError) {
            onError(lastError, attempt);
          }

          if (attempt <= maxRetries) {
            // Show retry notification
            toast.warning(
              'Retrying Operation',
              `${operationName || 'Operation'} failed. Retrying in ${
                retryDelay / 1000
              } seconds... (${attempt}/${maxRetries})`
            );

            // Wait before retrying
            await new Promise(resolve => {
              retryTimeoutRef.current = setTimeout(resolve, retryDelay * attempt);
            });
          }
        }
      }

      // Max retries reached
      setState(prev => ({
        ...prev,
        isRetrying: false,
      }));

      if (onMaxRetriesReached) {
        onMaxRetriesReached(lastError!);
      }

      toast.error(
        'Operation Failed',
        `${operationName || 'Operation'} failed after ${maxRetries} ${
          maxRetries === 1 ? 'attempt' : 'attempts'
        }. Please try again later.`
      );

      throw lastError!;
    },
    [maxRetries, retryDelay, onError, onSuccess, onMaxRetriesReached, toast]
  );

  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
    });
  }, []);

  const retry = useCallback(
    async <T>(operation: () => Promise<T>, operationName?: string): Promise<T> => {
      reset();
      return executeWithRetry(operation, operationName);
    },
    [executeWithRetry, reset]
  );

  return {
    ...state,
    executeWithRetry,
    retry,
    reset,
  };
}

// Specialized hook for network operations
export function useNetworkErrorRecovery() {
  const toast = useToastHelpers();

  return useErrorRecovery({
    maxRetries: 3,
    retryDelay: 2000,
    onError: (error, attempt) => {
      console.warn(`Network operation failed (attempt ${attempt}):`, error);
    },
    onMaxRetriesReached: (error) => {
      console.error('Network operation failed after all retries:', error);
      toast.error(
        'Connection Problem',
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    },
  });
}

// Specialized hook for user operations
export function useUserOperationRecovery() {
  const toast = useToastHelpers();

  return useErrorRecovery({
    maxRetries: 2,
    retryDelay: 1500,
    onError: (error, attempt) => {
      console.warn(`User operation failed (attempt ${attempt}):`, error);
    },
    onMaxRetriesReached: (error) => {
      console.error('User operation failed after all retries:', error);
    },
  });
}