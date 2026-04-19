import { Component } from "react";

/**
 * Error Boundary Component - catch React errors
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-red-600">
                Oops! Something went wrong
              </h1>
            </div>

            <p className="text-slate-600 mb-6">
              The application encountered an unexpected error. Please try
              refreshing the page.
            </p>

            {import.meta.env.DEV && (
              <details className="mb-6 text-sm">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium">
                  Error Details
                </summary>
                <pre className="mt-3 p-3 bg-slate-100 rounded text-slate-700 overflow-auto max-h-60 whitespace-pre-wrap break-words">
                  {this.state.error?.toString()}
                  {"\n\n"}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Refresh Page
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
