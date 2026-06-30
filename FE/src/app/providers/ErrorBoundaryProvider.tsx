
import {
  Component,
  createContext,
  useContext,
  type ErrorInfo,
  type ReactNode,
  type ReactElement,
} from "react";
import routes from "@/config/routes";

/* -------------------------------------------------------------------------- */
/* Error Reporting Layer                                                      */
/* -------------------------------------------------------------------------- */
function reportError(error: Error, info: ErrorInfo): void {
  console.error("[ERROR_BOUNDARY]", {
    message: error.message,
    stack: error.stack,
    componentStack: info.componentStack,
  });
}

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */
interface ErrorBoundaryContextValue {
  error: Error | null;
  reset: () => void;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(
  null,
);
ErrorBoundaryContext.displayName = "ErrorBoundaryContext";

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */
export function useErrorBoundary(): ErrorBoundaryContextValue {
  const ctx = useContext(ErrorBoundaryContext);
  if (!ctx) {
    throw new Error(
      "[useErrorBoundary] must be used within ErrorBoundaryProvider",
    );
  }
  return ctx;
}

/* -------------------------------------------------------------------------- */
/* Fallback UI                                                                */
/* -------------------------------------------------------------------------- */
interface ErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

function DefaultErrorFallback({
  error,
  onReset,
}: ErrorFallbackProps): ReactElement {
  const isDev = import.meta.env.DEV;
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-4 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            The application hit an unexpected error.
          </p>
          {isDev && (
            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-left text-xs text-red-500">
              {error.stack ?? error.message}
            </pre>
          )}
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => window.location.assign(routes.home)}
              className="rounded-md border px-4 py-2"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Class Error Boundary                                                       */
/* -------------------------------------------------------------------------- */
interface BoundaryState {
  error: Error | null;
}

interface BoundaryProps {
  children: ReactNode;
  fallback?: (props: ErrorFallbackProps) => ReactNode;
}

class ErrorBoundaryClass extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  constructor(props: BoundaryProps) {
    super(props);
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, info);
  }

  reset(): void {
    this.setState({ error: null });
  }

  render(): ReactNode {
    const { children, fallback } = this.props;
    const { error } = this.state;

    const contextValue: ErrorBoundaryContextValue = {
      error,
      reset: this.reset,
    };

    if (error) {
      const Fallback = fallback ?? DefaultErrorFallback;
      return (
        <ErrorBoundaryContext.Provider value={contextValue}>
          <Fallback error={error} onReset={this.reset} />
        </ErrorBoundaryContext.Provider>
      );
    }

    return (
      <ErrorBoundaryContext.Provider value={contextValue}>
        {children}
      </ErrorBoundaryContext.Provider>
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Provider — named export to match App.tsx import                           */
/* -------------------------------------------------------------------------- */
interface ErrorBoundaryProviderProps {
  children: ReactNode;
  fallback?: (props: ErrorFallbackProps) => ReactNode;
}

// ✅ Named export — App.tsx uses { ErrorBoundaryProvider }, not default import
export function ErrorBoundaryProvider({
  children,
  fallback,
}: ErrorBoundaryProviderProps): ReactElement {
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}

export default ErrorBoundaryProvider;