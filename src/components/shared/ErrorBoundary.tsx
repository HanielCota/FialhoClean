import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[FialhoClean] Unhandled render error:", error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red/[0.12] flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red" />
          </div>
          <div>
            <p className="text-[16px] font-semibold text-text mb-1">Something went wrong</p>
            <p className="text-[13px] text-text-muted max-w-sm">
              {this.state.error?.message ?? "An unexpected error occurred in this view."}
            </p>
          </div>
          <button
            type="button"
            onClick={this.reset}
            className="flex items-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-4 h-9 text-[13px] font-semibold text-text-muted hover:text-text hover:bg-white/[0.07] transition-all duration-150"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
