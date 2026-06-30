
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  RefreshTokenResponse,
} from "@/features/auth/types/auth.types";

import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getUser,
  setSession,
} from "@/features/auth/utils/authStorage";

import { authApi } from "@/features/auth/api/authApi";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type AuthState = "idle" | "hydrating" | "ready";

export interface AuthContextValue {
  user: AuthUser | null;
  state: AuthState;

  isHydrating: boolean;
  isAuthenticating: boolean;
  isAuthenticated: boolean;

  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;

  setUser: (user: AuthUser | null) => void;
}

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [state, setState] = useState<AuthState>("idle");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const mountedRef = useRef(false);

  // prevents duplicate refresh calls
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  // prevents stale async writes
  const authVersionRef = useRef(0);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);
  const isHydrating = state === "hydrating";

  /* ---------------------------------------------------------------------- */
  /* Mount safety                                                           */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetUser = useCallback((u: AuthUser | null) => {
    if (!mountedRef.current) return;
    setUser(u);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Refresh Session (deduped + race-safe)                                  */
  /* ---------------------------------------------------------------------- */

  const refreshSession = useCallback(async (): Promise<void> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearSession();
      safeSetUser(null);
      return;
    }

    const currentVersion = ++authVersionRef.current;

    const promise = (async () => {
      // Attempt refresh up to 2 times to handle transient network hiccups
      let lastError: unknown;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res: RefreshTokenResponse =
            await authApi.refreshToken(refreshToken);

          if (currentVersion !== authVersionRef.current) return;

          const refreshedUser = res.user ?? getUser();
          if (!refreshedUser) throw new Error("No user returned from refresh");

          setSession(refreshedUser, {
            accessToken: res.accessToken,
            refreshToken: res.refreshToken ?? refreshToken,
          });

          safeSetUser(refreshedUser);
          return; // success
        } catch (error) {
          lastError = error;
          // On first attempt, wait a short moment before retrying
          if (attempt === 1) {
            await new Promise((r) => setTimeout(r, 800));
            // Still valid version?
            if (currentVersion !== authVersionRef.current) return;
          }
        }
      }

      // Both attempts failed — only clear session on definitive auth rejection
      // (HTTP 401/403). Network errors, 5xx, and timeouts should NOT log the
      // user out; they should be treated as transient and leave session intact.
      console.error("[AUTH_REFRESH_ERROR]", lastError);
      if (currentVersion !== authVersionRef.current) return;

      const status =
        (lastError as { response?: { status?: number } })?.response?.status;
      const isAuthRejection = status === 401 || status === 403;

      if (isAuthRejection) {
        clearSession();
        safeSetUser(null);
      }
      // For network/server errors: leave tokens in storage so the next
      // refresh attempt (e.g. next API call) can succeed.
    })();

    refreshPromiseRef.current = promise;
    promise.finally(() => { refreshPromiseRef.current = null; });
    return promise;
  }, [safeSetUser]);

  /* ---------------------------------------------------------------------- */
  /* Hydration                                                              */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const hydrate = async () => {
      setState("hydrating");

      timeout = setTimeout(() => {
        console.warn("[AUTH_HYDRATION_TIMEOUT]");
        if (mountedRef.current) setState("ready");
      }, 8000);

      try {
        const storedUser = getUser();
        const refreshToken = getRefreshToken();

        // Bug fix: previously checked for accessToken presence, but access
        // tokens expire in 15m. On reload an expired-but-refreshable session
        // was being cleared before refresh was even attempted. Only the
        // refreshToken + storedUser need to exist to attempt hydration.
        if (!storedUser || !refreshToken) {
          clearSession();
          safeSetUser(null);
          return;
        }

        // Show the stored user immediately so UI doesn't flash logged-out
        safeSetUser(storedUser);

        // Refresh will update the user object if profile changed; if it
        // fails, refreshSession() itself calls clearSession+safeSetUser(null)
        // — don't double-clear here.
        await refreshSession();
      } catch (err: unknown){
        // Only clear if refreshSession threw unexpectedly (not a 401 —
        // refreshSession handles 401 internally and clears appropriately).
        console.error("[AUTH_HYDRATION_ERROR]", err);
        clearSession();
        safeSetUser(null);
      } finally {
        clearTimeout(timeout);
        if (mountedRef.current) setState("ready");
      }
    };

    void hydrate();

    return () => clearTimeout(timeout);
  }, [refreshSession, safeSetUser]);

  /* ---------------------------------------------------------------------- */
  /* Login                                                                  */
  /* ---------------------------------------------------------------------- */

  const login = useCallback(async (payload: LoginPayload) => {
    setIsAuthenticating(true);

    try {
      const res: LoginResponse = await authApi.login(payload);

      setSession(res.user, {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });

      safeSetUser(res.user);
    } catch (err: unknown) {
      console.error("[AUTH_LOGIN_ERROR]", err);
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsAuthenticating(false);
      }
    }
  }, [safeSetUser]);

  /* ---------------------------------------------------------------------- */
  /* Logout                                                                 */
  /* ---------------------------------------------------------------------- */

  const logout = useCallback(async () => {
    setIsAuthenticating(true);

    try {
      await authApi.logout();
    } catch (err: unknown){
      console.error("[AUTH_LOGOUT_ERROR]", err);
    } finally {
      clearSession();
      safeSetUser(null);

      if (mountedRef.current) {
        setIsAuthenticating(false);
      }
    }
  }, [safeSetUser]);

  /* ---------------------------------------------------------------------- */
  /* Context Value                                                         */
  /* ---------------------------------------------------------------------- */

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      state,

      isHydrating,
      isAuthenticating,
      isAuthenticated,

      login,
      logout,
      refreshSession,

      setUser: safeSetUser,
    }),
    [
      user,
      state,
      isHydrating,
      isAuthenticating,
      isAuthenticated,
      login,
      logout,
      refreshSession,
      safeSetUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}

export default AuthProvider;