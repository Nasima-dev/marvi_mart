import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Marvi Mart ErrorBoundary] Uncaught render error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 my-8">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#E8E1CF] p-8 text-center space-y-6 shadow-md">
            <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#1B4332] font-serif-marvi">
                {this.props.fallbackTitle || 'Display Interruption'}
              </h2>
              <p className="text-xs text-[#5E7264] leading-relaxed">
                A rendering issue occurred while displaying this section. Your cart and stored items remain safe.
              </p>
              {this.state.error?.message && (
                <div className="p-3 bg-red-50 text-red-700 text-[11px] rounded-xl border border-red-200 text-left font-mono break-words">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-[#1B4332] hover:bg-[#143225] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="w-full py-3 bg-[#FAF8F3] hover:bg-[#F2ECE0] text-[#1B4332] text-xs font-semibold rounded-xl border border-[#E0D7C4] transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4 text-[#D4AF37]" />
                <span>Go to Storefront</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
