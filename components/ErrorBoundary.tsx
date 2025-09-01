import React, { Component, ErrorInfo, ReactNode } from 'react';

// Fix: Add onImproveLocalAI to props interface
interface Props {
  children: ReactNode;
  onImproveLocalAI?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg text-brand-text-primary p-4" role="alert">
          <div className="bg-brand-surface p-8 rounded-lg border border-brand-error shadow-2xl text-center max-w-2xl">
            <h1 className="text-4xl font-bold text-brand-error mb-4">Oops! Something Went Wrong</h1>
            <p className="text-lg text-brand-text-secondary mb-6">
              An unexpected error occurred in the application. Please reload to continue.
            </p>
            {this.state.error && (
              <details className="bg-brand-bg p-3 rounded-lg text-left text-sm text-brand-text-secondary w-full overflow-auto mb-6 cursor-pointer">
                <summary className="font-semibold text-brand-text-primary">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  <code>{this.state.error.toString()}</code>
                </pre>
              </details>
            )}
            {/* Fix: Add flex container and the "Improve Local AI" button */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-6 py-3 bg-brand-accent text-white font-bold rounded-lg hover:bg-brand-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-surface"
              >
                Reload Page
              </button>
              {this.props.onImproveLocalAI && (
                  <button
                    onClick={this.props.onImproveLocalAI}
                    className="w-full sm:w-auto px-6 py-3 bg-brand-info text-white font-bold rounded-lg hover:bg-brand-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-surface"
                  >
                    Improve Local AI
                  </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
