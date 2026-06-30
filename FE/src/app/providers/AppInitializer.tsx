
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { apiClient } from "@/lib/api/apiClient";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type InitState = "idle" | "loading" | "ready";

interface AppInitializerProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
}

/* -------------------------------------------------------------------------- */
/* Logger                                                                     */
/* -------------------------------------------------------------------------- */

const log = (tag: string, payload?: unknown): void => {
  if (import.meta.env.DEV) {
    // structured logging for debugging
    console.log(tag, payload ?? "");
  }
};

/* -------------------------------------------------------------------------- */
/* Backend Health Check                                                      */
/* -------------------------------------------------------------------------- */

async function validateBackendConnection(signal?: AbortSignal): Promise<void> {
  try {
    await apiClient.get("/health", { signal });
    log("[INIT_BACKEND_OK]");
  } catch (error) {
    log("[INIT_BACKEND_FAIL]", error);
    // intentionally non-blocking
  }
}

/* -------------------------------------------------------------------------- */
/* Sentry Init                                                               */
/* -------------------------------------------------------------------------- */

async function initErrorReporting(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (!import.meta.env.PROD || !dsn) return;

  try {
    const { init } = await import("@sentry/react");

    init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.2,
    });

    log("[INIT_SENTRY_OK]");
  } catch (error) {
    log("[INIT_SENTRY_FAIL]", error);
  }
}

/* -------------------------------------------------------------------------- */
/* Feature Flags                                                             */
/* -------------------------------------------------------------------------- */

async function preloadFeatureFlags(): Promise<void> {
  return;
}

/* -------------------------------------------------------------------------- */
/* Locale Init                                                               */
/* -------------------------------------------------------------------------- */

async function initializeLocale(): Promise<void> {
  return;
}

/* -------------------------------------------------------------------------- */
/* Bootstrap Runner                                                          */
/* -------------------------------------------------------------------------- */

async function runBootstrap(signal?: AbortSignal): Promise<void> {
  const tasks: Promise<unknown>[] = [
    validateBackendConnection(signal),
    initErrorReporting(),
    preloadFeatureFlags(),
    initializeLocale(),
  ];

  const results = await Promise.allSettled(tasks);

  results.forEach((r, index) => {
    if (r.status === "rejected") {
      log(`[INIT_TASK_${index}_FAILED]`, r.reason);
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Timeout Utility                                                           */
/* -------------------------------------------------------------------------- */

function withTimeout<T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Bootstrap timeout exceeded"));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/* -------------------------------------------------------------------------- */
/* Loading UI                                                                */
/* -------------------------------------------------------------------------- */

function DefaultLoadingFallback(): ReactElement {
  return (
    <div
      role="status"
      aria-label="Initializing application"
      className="flex h-screen w-screen items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />

        <div className="text-center">
          <h2 className="text-sm font-medium">CRM Helpdesk</h2>
          <p className="text-xs text-muted-foreground">
            Initializing workspace...
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                */
/* -------------------------------------------------------------------------- */

export default function AppInitializer({
  children,
  loadingFallback = <DefaultLoadingFallback />,
}: AppInitializerProps): ReactElement {
  const [state, setState] = useState<InitState>("idle");

  const mountedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    setState("loading");

    const controller = new AbortController();
    abortRef.current = controller;

    const startTime = performance?.now?.();

    void withTimeout(runBootstrap(controller.signal), 10000)
      .then(() => {
        if (!mountedRef.current) return;

        if (typeof startTime === "number" && performance?.now) {
          log("[INIT_DURATION_MS]", performance.now() - startTime);
        }

        setState("ready");
      })
      .catch((error) => {
        log("[APP_INIT_ERROR]", error);

        // never block app render
        if (mountedRef.current) {
          setState("ready");
        }
      });

    return () => {
      mountedRef.current = false;
      controller.abort();
      abortRef.current = null;
    };
  }, []);

  if (state !== "ready") {
    return <>{loadingFallback}</>;
  }

  return <>{children}</>;
}