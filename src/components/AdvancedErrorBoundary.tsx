import React, { Component, ErrorInfo, ReactNode } from 'react';

// Error boundary state interface
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

// Error boundary props interface
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  onRetry?: () => void;
  maxRetries?: number;
  showErrorDetails?: boolean;
  enableReporting?: boolean;
}

// Advanced Error Boundary Component
export class AdvancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableReporting = true } = this.props;
    const { errorId } = this.state;

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler
    if (onError && errorId) {
      onError(error, errorInfo, errorId);
    }

    // Report error to monitoring service (if enabled)
    if (enableReporting && errorId) {
      this.reportError(error, errorInfo, errorId);
    }

    // Log error details
    console.error('🚨 Advanced Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
  }

  // Report error to external service
  private reportError = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      performance: {
        memory: (performance as any).memory,
        timing: performance.timing,
      },
    };

    // Send to error reporting service (implement based on your service)
    // Example: sendToErrorReportingService(errorReport);

    // For now, store in localStorage for debugging
    const existingReports = JSON.parse(localStorage.getItem('error-reports') || '[]');
    existingReports.push(errorReport);
    // Keep only last 50 error reports
    if (existingReports.length > 50) {
      existingReports.shift();
    }
    localStorage.setItem('error-reports', JSON.stringify(existingReports));
  };

  // Retry rendering the component
  private handleRetry = () => {
    const { onRetry, maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      // Clear error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: retryCount + 1,
      });

      // Call custom retry handler
      if (onRetry) {
        onRetry();
      }
    } else {
      console.warn('❌ Max retry attempts reached, cannot retry further');
    }
  };

  // Reset error boundary
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  // Reload the page
  private handleReload = () => {
    window.location.reload();
  };

  // Go back to previous page
  private handleGoBack = () => {
    window.history.back();
  };

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { children, fallback, maxRetries = 3, showErrorDetails = false } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="advanced-error-boundary min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
                <p className="text-gray-600">
                  An unexpected error occurred while rendering this component.
                </p>
              </div>
            </div>

            {/* Error ID for tracking */}
            {errorId && (
              <div className="mb-4 p-3 bg-gray-100 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Error ID:</strong> {errorId}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Please include this ID when reporting the issue.
                </p>
              </div>
            )}

            {/* Error details (only in development or when enabled) */}
            {showErrorDetails && error && (
              <div className="mb-4">
                <details className="bg-red-50 border border-red-200 rounded-md p-4">
                  <summary className="cursor-pointer text-red-800 font-medium mb-2">
                    Error Details (Click to expand)
                  </summary>
                  <div className="text-sm text-red-700 space-y-2">
                    <div>
                      <strong>Message:</strong>
                      <pre className="mt-1 whitespace-pre-wrap font-mono text-xs bg-red-100 p-2 rounded">
                        {error.message}
                      </pre>
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap font-mono text-xs bg-red-100 p-2 rounded max-h-40 overflow-y-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap font-mono text-xs bg-red-100 p-2 rounded max-h-40 overflow-y-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Retry button */}
              {retryCount < maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Try Again ({retryCount}/{maxRetries})
                </button>
              )}

              {/* Reset button */}
              <button
                onClick={this.handleReset}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reset
              </button>

              {/* Go Back button */}
              <button
                onClick={this.handleGoBack}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Go Back
              </button>

              {/* Reload button */}
              <button
                onClick={this.handleReload}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reload Page
              </button>
            </div>

            {/* Additional help text */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">What happened?</h3>
              <p className="text-sm text-blue-700">
                This error has been automatically reported to our development team. We&apos;re
                working to fix this issue. In the meantime, you can try the actions above or contact
                support if the problem persists.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Hook for using error boundary functionality
export const useErrorRecovery = () => {
  const [errorCount, setErrorCount] = React.useState(0);
  const [lastError, setLastError] = React.useState<Error | null>(null);

  const handleError = React.useCallback(
    (error: Error, errorInfo: ErrorInfo, errorId: string) => {
      setErrorCount((prev) => prev + 1);
      setLastError(error);

      // Log to console with additional context
      console.error('🚨 Error Recovery Hook:', {
        errorId,
        error: error.message,
        componentStack: errorInfo.componentStack,
        recoveryAttempts: errorCount + 1,
      });
    },
    [errorCount]
  );

  const resetError = React.useCallback(() => {
    setErrorCount(0);
    setLastError(null);
  }, []);

  return {
    errorCount,
    lastError,
    handleError,
    resetError,
  };
};

// Higher-order component for wrapping components with error boundary
export const withAdvancedErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <AdvancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AdvancedErrorBoundary>
  );

  WrappedComponent.displayName = `withAdvancedErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

export default AdvancedErrorBoundary;
