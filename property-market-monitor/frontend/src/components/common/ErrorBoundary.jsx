import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 my-4 bg-red-50 border border-red-200 rounded-xl text-center shadow-xs">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {this.props.title || 'Something went wrong displaying this section'}
          </h3>
          <p className="text-xs text-red-700 max-w-md mx-auto mb-4 font-mono bg-red-100/60 p-2 rounded">
            {this.state.error?.message || 'An unexpected rendering error occurred'}
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center px-3.5 py-1.5 bg-white border border-gray-300 text-xs font-medium rounded-md text-gray-700 hover:bg-gray-50 shadow-xs"
            >
              <RotateCcw size={14} className="mr-1.5" />
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-3.5 py-1.5 bg-red-600 text-xs font-medium rounded-md text-white hover:bg-red-700 shadow-xs"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
