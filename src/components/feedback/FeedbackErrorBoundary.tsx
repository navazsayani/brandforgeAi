'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface FeedbackErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface FeedbackErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class FeedbackErrorBoundary extends React.Component<
  FeedbackErrorBoundaryProps,
  FeedbackErrorBoundaryState
> {
  constructor(props: FeedbackErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): FeedbackErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error('Feedback component error:', error, errorInfo);
    
    // In production, you might want to send this to an error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center text-sm text-muted-foreground">
            <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
            <span>Feedback temporarily unavailable</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            The feedback system encountered an error. Your content was saved successfully.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withFeedbackErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <FeedbackErrorBoundary fallback={fallback}>
      <Component {...props} />
    </FeedbackErrorBoundary>
  );
  
  WrappedComponent.displayName = `withFeedbackErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Minimal fallback component for critical areas
export const MinimalFeedbackFallback: React.FC = () => (
  <div className="text-xs text-gray-400 italic">
    Feedback unavailable
  </div>
);

// Detailed fallback component for development/debugging
export const DetailedFeedbackFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="p-3 border border-red-200 rounded-lg bg-red-50">
    <div className="flex items-center text-sm text-red-700 mb-2">
      <AlertTriangle className="w-4 h-4 mr-2" />
      <span className="font-medium">Feedback System Error</span>
    </div>
    <div className="text-xs text-red-600 space-y-1">
      <div>The feedback component failed to load properly.</div>
      {error && (
        <div className="font-mono bg-red-100 p-2 rounded text-xs">
          {error.message}
        </div>
      )}
      <div className="text-red-500">
        Your content was saved successfully. Only the feedback feature is affected.
      </div>
    </div>
  </div>
);