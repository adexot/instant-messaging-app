interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
  userAgent?: string;
  url?: string;
}

interface ErrorLog {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  log(
    error: Error,
    context: ErrorContext = {},
    severity: ErrorLog['severity'] = 'medium'
  ): string {
    const id = this.generateId();
    const timestamp = new Date();

    const errorLog: ErrorLog = {
      id,
      error,
      context: {
        ...context,
        timestamp,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      severity,
      timestamp,
    };

    this.logs.unshift(errorLog);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${severity.toUpperCase()}] - ${id}`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Stack:', error.stack);
      console.groupEnd();
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production' && severity === 'critical') {
      this.reportCriticalError(errorLog);
    }

    return id;
  }

  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private reportCriticalError(errorLog: ErrorLog): void {
    // In a real application, you would send this to an error reporting service
    // like Sentry, Bugsnag, or your own logging endpoint
    console.error('Critical error reported:', errorLog);
    
    // Example: Send to error reporting service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorLog)
    // }).catch(err => console.error('Failed to report error:', err));
  }

  getLogs(severity?: ErrorLog['severity']): ErrorLog[] {
    if (severity) {
      return this.logs.filter(log => log.severity === severity);
    }
    return [...this.logs];
  }

  getLogById(id: string): ErrorLog | undefined {
    return this.logs.find(log => log.id === id);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Helper methods for different error types
  logNetworkError(error: Error, context: Omit<ErrorContext, 'component'> = {}): string {
    return this.log(error, { ...context, component: 'Network' }, 'high');
  }

  logValidationError(error: Error, context: Omit<ErrorContext, 'component'> = {}): string {
    return this.log(error, { ...context, component: 'Validation' }, 'low');
  }

  logUserError(error: Error, context: Omit<ErrorContext, 'component'> = {}): string {
    return this.log(error, { ...context, component: 'User' }, 'medium');
  }

  logSystemError(error: Error, context: Omit<ErrorContext, 'component'> = {}): string {
    return this.log(error, { ...context, component: 'System' }, 'critical');
  }

  logComponentError(
    error: Error,
    componentName: string,
    context: Omit<ErrorContext, 'component'> = {}
  ): string {
    return this.log(error, { ...context, component: componentName }, 'medium');
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  errorLogger.logSystemError(
    new Error(event.message),
    {
      action: 'unhandled_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    }
  );
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason));
    
  errorLogger.logSystemError(error, {
    action: 'unhandled_promise_rejection',
    metadata: {
      reason: event.reason,
    },
  });
});

// React error boundary helper
export function logReactError(
  error: Error,
  errorInfo: React.ErrorInfo,
  componentName?: string
): string {
  return errorLogger.logComponentError(error, componentName || 'Unknown', {
    action: 'react_error_boundary',
    metadata: {
      componentStack: errorInfo.componentStack,
    },
  });
}

// Hook for logging errors in components
export function useErrorLogger(componentName: string) {
  return {
    logError: (error: Error, context: Omit<ErrorContext, 'component'> = {}) =>
      errorLogger.logComponentError(error, componentName, context),
    logNetworkError: (error: Error, context: Omit<ErrorContext, 'component'> = {}) =>
      errorLogger.logNetworkError(error, context),
    logValidationError: (error: Error, context: Omit<ErrorContext, 'component'> = {}) =>
      errorLogger.logValidationError(error, context),
    logUserError: (error: Error, context: Omit<ErrorContext, 'component'> = {}) =>
      errorLogger.logUserError(error, context),
  };
}