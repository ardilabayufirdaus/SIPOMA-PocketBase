import React, { Component, ErrorInfo, ReactNode } from 'react';
import { translations } from '../translations';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  retry?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Save error info to state for possible rendering
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private resetErrorBoundary = () => {
    // Reset the error state
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });

    // Call the optional reset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        // Check if fallback is a function (render prop pattern)
        if (typeof this.props.fallback === 'function' && this.state.error) {
          return this.props.fallback(this.state.error, this.resetErrorBoundary);
        }
        // Fallback is a ReactNode
        return this.props.fallback as ReactNode;
      }

      // Default error UI with retry button option
      const language = localStorage.getItem('sipoma-language') === 'id' ? 'id' : 'en';
      const t = translations[language];

      // Enhanced error display with more detailed information
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">{t.error_title}</h3>
          <p className="text-red-700 mb-4">{t.error_message}</p>

          {/* Show error message in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-4 mb-4 p-3 bg-red-100 rounded text-left overflow-auto max-h-40">
              <p className="text-sm font-mono text-red-800 whitespace-pre-wrap">
                {this.state.error.toString()}
              </p>
            </div>
          )}

          {/* Only show retry button if retry is explicitly true or undefined (default behavior) */}
          {this.props.retry !== false && (
            <button
              onClick={this.resetErrorBoundary}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              data-testid="error-boundary-retry"
            >
              {t.error_retry}
            </button>
          )}
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
