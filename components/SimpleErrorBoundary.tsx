/**
 * Simple error boundary component for lazy loading with suspense
 */
import React from 'react';

interface SimpleErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface SimpleErrorBoundaryState {
  hasError: boolean;
}

class SimpleErrorBoundary extends React.Component<
  SimpleErrorBoundaryProps,
  SimpleErrorBoundaryState
> {
  constructor(props: SimpleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Error loading component</div>;
    }

    return this.props.children;
  }
}

export default SimpleErrorBoundary;
