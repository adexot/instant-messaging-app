import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../lib/instant';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface ConnectionState {
  status: ConnectionStatus;
  isReconnecting: boolean;
  lastConnected?: Date;
  error?: string;
  retryCount: number;
}

interface UseConnectionReturn extends ConnectionState {
  reconnect: () => void;
  isOnline: boolean;
}

export function useConnection(): UseConnectionReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'connecting',
    isReconnecting: false,
    retryCount: 0,
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const retryCountRef = useRef(0);
  const maxRetries = 10;
  const baseDelay = 1000; // 1 second

  // Calculate exponential backoff delay
  const getRetryDelay = (retryCount: number): number => {
    return Math.min(baseDelay * Math.pow(2, retryCount), 30000); // Max 30 seconds
  };

  // Check if browser is online
  const isOnline = navigator.onLine;

  // Monitor instant-db connection status
  const checkConnectionStatus = useCallback(async () => {
    try {
      // Test connection by making a simple query
      await db.queryOnce({ users: { $: { limit: 1 } } });
      
      if (connectionState.status !== 'connected') {
        setConnectionState(prev => ({
          ...prev,
          status: 'connected',
          isReconnecting: false,
          lastConnected: new Date(),
          error: undefined,
          retryCount: 0,
        }));
        retryCountRef.current = 0;
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
    }
  }, [connectionState.status]);

  // Reconnect with exponential backoff
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (retryCountRef.current >= maxRetries) {
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        isReconnecting: false,
        error: 'Max reconnection attempts reached',
      }));
      return;
    }

    setConnectionState(prev => ({
      ...prev,
      status: 'connecting',
      isReconnecting: true,
      retryCount: retryCountRef.current,
    }));

    const delay = getRetryDelay(retryCountRef.current);
    retryCountRef.current += 1;

    reconnectTimeoutRef.current = setTimeout(async () => {
      await checkConnectionStatus();
    }, delay);
  }, [checkConnectionStatus]);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('Browser came online, checking connection...');
      checkConnectionStatus();
    };

    const handleOffline = () => {
      console.log('Browser went offline');
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected',
        error: 'No internet connection',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnectionStatus]);

  // Initial connection check and periodic monitoring
  useEffect(() => {
    checkConnectionStatus();

    // Check connection every 30 seconds when connected
    const interval = setInterval(() => {
      if (connectionState.status === 'connected') {
        checkConnectionStatus();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [checkConnectionStatus, connectionState.status]);

  // Auto-reconnect when disconnected
  useEffect(() => {
    if (connectionState.status === 'disconnected' || connectionState.status === 'error') {
      if (isOnline && !connectionState.isReconnecting) {
        const delay = getRetryDelay(retryCountRef.current);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnect();
        }, delay);
      }
    }
  }, [connectionState.status, connectionState.isReconnecting, isOnline, reconnect]);

  return {
    ...connectionState,
    reconnect,
    isOnline,
  };
}