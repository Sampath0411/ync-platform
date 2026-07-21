import { Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiExclamationCircle, HiHome, HiRefresh } from 'react-icons/hi';

class ErrorBoundaryClass extends Component {
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
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="relative overflow-hidden bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-lg shadow-black/5 rounded-2xl p-8 md:p-12 max-w-md w-full text-center">
            {/* Glass morphism gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 pointer-events-none" />

            <div className="relative">
              {/* Gradient icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 dark:from-red-500/10 dark:to-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <HiExclamationCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
              </div>

              {/* Heading */}
              <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h2>

              {/* Error message */}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                {error?.message || 'An unexpected error occurred. Please try again.'}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-orange-600 via-red-600 to-orange-500 text-white hover:shadow-lg hover:shadow-orange-500/25 active:shadow-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  <HiRefresh className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={() => this.props.navigate('/')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border-2 border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/50 hover:border-orange-500/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  <HiHome className="w-4 h-4" />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ErrorBoundary({ children }) {
  const navigate = useNavigate();
  return <ErrorBoundaryClass navigate={navigate}>{children}</ErrorBoundaryClass>;
}
