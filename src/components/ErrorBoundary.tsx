import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, WifiOff } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkLoadError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isChunkLoadError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    const isChunk =
      error.name === "ChunkLoadError" ||
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed");
    return { hasError: true, error, isChunkLoadError: isChunk };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[TechShastra ErrorBoundary] Uncaught runtime exception:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, isChunkLoadError: false });
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
          <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-primary/20 bg-card/60 backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
              {isOffline || this.state.isChunkLoadError ? (
                <WifiOff className="w-8 h-8 text-amber-500 animate-pulse" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-destructive" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-heading tracking-tight text-foreground">
                {isOffline || this.state.isChunkLoadError
                  ? "Connection Interrupted"
                  : "Something went wrong"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isOffline
                  ? "You appear to be offline. Please verify your internet connection and try reloading."
                  : this.state.isChunkLoadError
                  ? "A new update was published or the network dropped while downloading page resources."
                  : this.state.error?.message || "An unexpected error occurred while rendering this page."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={this.handleRetry}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl h-11"
              >
                <RefreshCw className="w-4 h-4" />
                Reload & Retry
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="gap-2 rounded-xl h-11 border-border/60 hover:bg-muted"
              >
                <Home className="w-4 h-4" />
                Return Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
