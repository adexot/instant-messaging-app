import { useState, useEffect, useCallback, useRef } from 'react';
// Removed unused import

interface QueuedMessage {
  id: string;
  content: string;
  senderId: string;
  senderAlias: string;
  timestamp: Date;
  retryCount: number;
}

interface OfflineQueueState {
  queuedMessages: QueuedMessage[];
  isProcessing: boolean;
}

interface UseOfflineQueueReturn extends OfflineQueueState {
  addToQueue: (message: Omit<QueuedMessage, 'retryCount'>) => void;
  processQueue: (sendFunction: (message: QueuedMessage) => Promise<void>) => Promise<void>;
  clearQueue: () => void;
  removeFromQueue: (messageId: string) => void;
}

const STORAGE_KEY = 'instant-messaging-offline-queue';
const MAX_RETRY_COUNT = 3;

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [queueState, setQueueState] = useState<OfflineQueueState>({
    queuedMessages: [],
    isProcessing: false,
  });

  const processingRef = useRef(false);

  // Load queued messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const queuedMessages = JSON.parse(stored).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        
        setQueueState(prev => ({
          ...prev,
          queuedMessages,
        }));
      }
    } catch (error) {
      console.error('Failed to load offline queue from localStorage:', error);
    }
  }, []);

  // Save queued messages to localStorage whenever queue changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queueState.queuedMessages));
    } catch (error) {
      console.error('Failed to save offline queue to localStorage:', error);
    }
  }, [queueState.queuedMessages]);

  // Add message to offline queue
  const addToQueue = useCallback((message: Omit<QueuedMessage, 'retryCount'>) => {
    const queuedMessage: QueuedMessage = {
      ...message,
      retryCount: 0,
    };

    setQueueState(prev => ({
      ...prev,
      queuedMessages: [...prev.queuedMessages, queuedMessage],
    }));

    console.log('Message added to offline queue:', queuedMessage.id);
  }, []);

  // Remove message from queue
  const removeFromQueue = useCallback((messageId: string) => {
    setQueueState(prev => ({
      ...prev,
      queuedMessages: prev.queuedMessages.filter(msg => msg.id !== messageId),
    }));
  }, []);

  // Process queued messages when connection is restored
  const processQueue = useCallback(async (
    sendFunction: (message: QueuedMessage) => Promise<void>
  ) => {
    if (processingRef.current || queueState.queuedMessages.length === 0) {
      return;
    }

    processingRef.current = true;
    setQueueState(prev => ({ ...prev, isProcessing: true }));

    console.log(`Processing ${queueState.queuedMessages.length} queued messages...`);

    const messagesToProcess = [...queueState.queuedMessages];
    const failedMessages: QueuedMessage[] = [];

    for (const message of messagesToProcess) {
      try {
        await sendFunction(message);
        
        // Remove successfully sent message from queue
        setQueueState(prev => ({
          ...prev,
          queuedMessages: prev.queuedMessages.filter(msg => msg.id !== message.id),
        }));

        console.log('Queued message sent successfully:', message.id);
        
        // Small delay between messages to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('Failed to send queued message:', message.id, error);
        
        // Increment retry count
        const updatedMessage = {
          ...message,
          retryCount: message.retryCount + 1,
        };

        if (updatedMessage.retryCount < MAX_RETRY_COUNT) {
          failedMessages.push(updatedMessage);
        } else {
          console.warn('Message exceeded max retry count, removing from queue:', message.id);
          // Remove message that exceeded retry limit
          setQueueState(prev => ({
            ...prev,
            queuedMessages: prev.queuedMessages.filter(msg => msg.id !== message.id),
          }));
        }
      }
    }

    // Update retry counts for failed messages
    if (failedMessages.length > 0) {
      setQueueState(prev => ({
        ...prev,
        queuedMessages: prev.queuedMessages.map(msg => {
          const failedMsg = failedMessages.find(f => f.id === msg.id);
          return failedMsg || msg;
        }),
      }));
    }

    setQueueState(prev => ({ ...prev, isProcessing: false }));
    processingRef.current = false;

    console.log('Queue processing completed');
  }, [queueState.queuedMessages]);

  // Clear all queued messages
  const clearQueue = useCallback(() => {
    setQueueState(prev => ({
      ...prev,
      queuedMessages: [],
    }));
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear offline queue from localStorage:', error);
    }
  }, []);

  return {
    ...queueState,
    addToQueue,
    processQueue,
    clearQueue,
    removeFromQueue,
  };
}