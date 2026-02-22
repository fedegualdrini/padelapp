"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <div className="rounded-full bg-red-500/10 p-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[var(--ink)]">
              Algo salió mal
            </h3>
            <p className="text-sm text-[var(--muted)] max-w-md">
              {this.state.error?.message || "Ocurrió un error inesperado. Por favor, intentá de nuevo."}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[color:var(--card-solid)]"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for wrapping specific sections
export function ErrorBoundaryWrapper({ 
  children, 
  message 
}: { 
  children: ReactNode; 
  message?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-[100px] flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-[var(--muted)]">
            {message || "Error al cargar esta sección"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Reintentar
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
