import { useConnection } from '../hooks/useConnection';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { ConnectionBanner, ConnectionDot } from './ui/connection-status';
import { Button } from '../../@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  className?: string;
  showBanner?: boolean;
  showDot?: boolean;
}

export function ConnectionStatus({ 
  className, 
  showBanner = true, 
  showDot = false 
}: ConnectionStatusProps) {
  const { status, reconnect, isReconnecting, retryCount } = useConnection();
  const { queuedMessages } = useOfflineQueue();

  const handleRetry = () => {
    reconnect();
  };

  if (showDot) {
    return <ConnectionDot status={status} className={className} />;
  }

  if (showBanner) {
    return (
      <div className={className}>
        <ConnectionBanner 
          status={status} 
          onRetry={handleRetry}
        />
        
        {/* Show queued messages info when offline */}
        {queuedMessages.length > 0 && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-700">
            <div className="flex items-center justify-between">
              <span>
                {queuedMessages.length} message{queuedMessages.length !== 1 ? 's' : ''} queued for sending
              </span>
              {status === 'connected' && (
                <span className="text-xs">Syncing...</span>
              )}
            </div>
          </div>
        )}

        {/* Show retry info when reconnecting */}
        {isReconnecting && retryCount > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700">
            <div className="flex items-center justify-between">
              <span>Reconnecting... (attempt {retryCount})</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRetry}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry now
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Header component with connection dot
export function ConnectionStatusHeader({ className }: { className?: string }) {
  const { status } = useConnection();
  
  return (
    <div className={className}>
      <ConnectionDot status={status} />
    </div>
  );
}