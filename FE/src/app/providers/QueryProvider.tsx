
import {
  type PropsWithChildren,
  type ReactElement,
  lazy,
  Suspense,
} from "react";

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";

import type { QueryMeta } from "@tanstack/react-query";
import { AxiosError } from "axios";

/* -------------------------------------------------------------------------- */
/* Devtools                                                                   */
/* -------------------------------------------------------------------------- */

const ReactQueryDevtools =
  import.meta.env.DEV
    ? lazy(() =>
        import("@tanstack/react-query-devtools").then((m) => ({
          default: m.ReactQueryDevtools,
        })),
      )
    : null;

/* -------------------------------------------------------------------------- */
/* Error Utilities (safe + strict)                                           */
/* -------------------------------------------------------------------------- */

function getStatusCode(error: unknown): number | null {
  if (error instanceof AxiosError) {
    return error.response?.status ?? null;
  }
  return null;
}

function isClientError(error: unknown): boolean {
  const status = getStatusCode(error);
  return status !== null && status >= 400 && status < 500;
}

function isAuthError(error: unknown): boolean {
  const status = getStatusCode(error);
  return status === 401 || status === 403;
}

/* -------------------------------------------------------------------------- */
/* Retry Strategy (stable + predictable)                                      */
/* -------------------------------------------------------------------------- */

function retryDelay(attempt: number): number {
  // exponential backoff capped at 30s
  return Math.min(1000 * Math.pow(2, attempt), 30_000);
}

/* -------------------------------------------------------------------------- */
/* Error Handler                                                              */
/* -------------------------------------------------------------------------- */

type MetaWithFlags = QueryMeta & {
  silent?: boolean;
};

function handleQueryError(error: unknown, meta?: QueryMeta): void {
  const silent = (meta as MetaWithFlags | undefined)?.silent ?? false;

  if (silent) return;

  if (import.meta.env.DEV) {
    console.error("[QUERY_ERROR]", error);
  }

  // future hooks:
  // - toast system
  // - auth refresh trigger
  // - Sentry / logging pipeline
}

/* -------------------------------------------------------------------------- */
/* Query Client (singleton-safe, auth-aware)                                  */
/* -------------------------------------------------------------------------- */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,

      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,

      networkMode: "online",

      retry: (failureCount, error) => {
        // hard stop for auth failures
        if (isAuthError(error)) return false;

        // no retry for client-side validation errors
        if (isClientError(error)) return false;

        return failureCount < 3;
      },

      retryDelay,
    },

    mutations: {
      retry: false,
      networkMode: "online",
    },
  },

  /* ---------------------------------------------------------------------- */
  /* Query Cache                                                            */
  /* ---------------------------------------------------------------------- */

  queryCache: new QueryCache({
    onError: (error, query) => {
      handleQueryError(error, query.meta);
    },
  }),

  /* ---------------------------------------------------------------------- */
  /* Mutation Cache                                                         */
  /* ---------------------------------------------------------------------- */

  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      handleQueryError(error, mutation.meta);
    },
  }),
});

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function QueryProvider({
  children,
}: PropsWithChildren): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-right"
          />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}

export default QueryProvider;