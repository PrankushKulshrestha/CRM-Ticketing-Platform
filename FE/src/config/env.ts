

/*
|--------------------------------------------------------------------------
| Frontend Environment Configuration
|--------------------------------------------------------------------------
| Strictly typed, normalized, production-safe environment layer
|--------------------------------------------------------------------------
*/

function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value !== "string") return fallback;
  return value.toLowerCase() === "true";
}

function requiredString(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return fallback;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return undefined;
}

/* -------------------------------------------------------------------------- */
/* ENV CONFIG                                                                */
/* -------------------------------------------------------------------------- */

export const ENV = Object.freeze({
  /* App Meta */
  APP_NAME: requiredString(
    import.meta.env.VITE_APP_NAME,
    "CRM Helpdesk",
  ),

  APP_VERSION: requiredString(
    import.meta.env.VITE_APP_VERSION,
    "1.0.0",
  ),

  APP_ENV: import.meta.env.MODE as
    | "development"
    | "production"
    | "test",

  IS_DEV: Boolean(import.meta.env.DEV),
  IS_PROD: Boolean(import.meta.env.PROD),

  /* API */
  API_BASE_URL: requiredString(
    import.meta.env.VITE_API_BASE_URL,
    "http://localhost:5000/api/v1",
  ),

  SOCKET_URL: requiredString(
    import.meta.env.VITE_SOCKET_URL,
    "http://localhost:5000",
  ),

  /* Feature Flags */
  ENABLE_ANALYTICS: parseBoolean(
    import.meta.env.VITE_ENABLE_ANALYTICS,
    true,
  ),

  ENABLE_NOTIFICATIONS: parseBoolean(
    import.meta.env.VITE_ENABLE_NOTIFICATIONS,
    true,
  ),

  /* Observability */
  SENTRY_DSN: optionalString(import.meta.env.VITE_SENTRY_DSN),
} as const);

/* -------------------------------------------------------------------------- */
/* Derived helpers                                                           */
/* -------------------------------------------------------------------------- */

export const IS_BROWSER = typeof window !== "undefined";

export const IS_SERVER = !IS_BROWSER;

export const IS_DEVELOPMENT =
  ENV.APP_ENV === "development" || ENV.IS_DEV;

export const IS_PRODUCTION =
  ENV.APP_ENV === "production" || ENV.IS_PROD;

export const HAS_SENTRY = Boolean(ENV.SENTRY_DSN);

/* -------------------------------------------------------------------------- */

export default ENV;