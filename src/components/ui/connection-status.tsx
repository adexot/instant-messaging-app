import { cn } from '../../lib/utils';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  className?: string;
  showText?: boolean;
}

export function ConnectionStatusIndicator({ 
  status, 
  className,
  showText = false 
}: ConnectionStatusProps) {
  const getStatusConfig = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          text: 'Connected',
          pulse: false
        };
      case 'connecting':
        return {
          icon: Wifi,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          text: 'Connecting...',
          pulse: true
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          text: 'Disconnected',
          pulse: false
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          text: 'Connection Error',
          pulse: false
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex items-center space-x-2 px-2 py-1 rounded-full',
      config.bgColor,
      className
    )}>
      <Icon 
        className={cn(
          'h-4 w-4',
          config.color,
          config.pulse && 'animate-pulse'
        )} 
      />
      {showText && (
        <span className={cn('text-xs font-medium', config.color)}>
          {config.text}
        </span>
      )}
    </div>
  );
}

interface ConnectionBannerProps {
  status: ConnectionStatus;
  onRetry?: () => void;
  className?: string;
}

export function ConnectionBanner({ status, onRetry, className }: ConnectionBannerProps) {
  if (status === 'connected') return null;

  const getMessage = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting to chat...';
      case 'disconnected':
        return 'Connection lost. Messages may not sync.';
      case 'error':
        return 'Connection error. Please check your internet connection.';
      default:
        return '';
    }
  };

  const isError = status === 'disconnected' || status === 'error';

  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-2 text-sm',
      isError ? 'bg-red-50 text-red-700 border-b border-red-200' : 'bg-yellow-50 text-yellow-700 border-b border-yellow-200',
      className
    )}>
      <div className="flex items-center space-x-2">
        <ConnectionStatusIndicator status={status} />
        <span>{getMessage()}</span>
      </div>
      {isError && onRetry && (
        <button
          onClick={onRetry}
          className="text-xs underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

interface ConnectionDotProps {
  status: ConnectionStatus;
  className?: string;
}

export function ConnectionDot({ status, className }: ConnectionDotProps) {
  const getColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
    }
  };

  return (
    <div className={cn(
      'w-2 h-2 rounded-full',
      getColor(),
      className
    )} />
  );
}
