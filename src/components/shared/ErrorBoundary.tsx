import i18next from "i18next";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

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

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red/[0.12]">
            <AlertTriangle className="h-7 w-7 text-red" />
          </div>
          <div>
            <p className="mb-1 font-semibold text-[16px] text-text">
              {i18next.t("errorBoundary.title")}
            </p>
            <p className="max-w-sm text-[13px] text-text-muted">
              {this.state.error?.message ?? i18next.t("errorBoundary.message")}
            </p>
          </div>
          <button
            type="button"
            onClick={this.reset}
            className="flex h-9 items-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-4 font-semibold text-[13px] text-text-muted transition-all duration-150 hover:bg-white/[0.07] hover:text-text"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {i18next.t("common.retry")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
