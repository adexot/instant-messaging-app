import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '../../../@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  className?: string;
}

export function ErrorState({ 
  title = 'Something went wrong',
  message, 
  action,
  icon,
  className 
}: ErrorStateProps) {
  return (
    <Card className={cn('max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {icon || <AlertCircle className="h-12 w-12 text-destructive" />}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      {action && (
        <CardContent className="text-center">
          <Button onClick={action.onClick} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div className={cn(
      'flex items-center space-x-2 text-sm text-destructive',
      'bg-destructive/10 border border-destructive/20 rounded-md p-2',
      className
    )}>
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

interface ConnectionErrorProps {
  isConnected: boolean;
  onRetry?: () => void;
  className?: string;
}

export function ConnectionError({ isConnected, onRetry, className }: ConnectionErrorProps) {
  if (isConnected) return null;

  return (
    <div className={cn(
      'flex items-center justify-between',
      'bg-destructive/10 border border-destructive/20 rounded-md p-3',
      'text-sm text-destructive',
      className
    )}>
      <div className="flex items-center space-x-2">
        <WifiOff className="h-4 w-4" />
        <span>Connection lost. Messages may not sync.</span>
      </div>
      {onRetry && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onRetry}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

interface MessageErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function MessageError({ message, onRetry, className }: MessageErrorProps) {
  return (
    <div className={cn(
      'flex items-center justify-between',
      'bg-destructive/5 border border-destructive/20 rounded-md p-2',
      'text-xs text-destructive',
      className
    )}>
      <div className="flex items-center space-x-1">
        <AlertCircle className="h-3 w-3" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onRetry}
          className="h-5 px-1 text-xs hover:bg-destructive/10"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
