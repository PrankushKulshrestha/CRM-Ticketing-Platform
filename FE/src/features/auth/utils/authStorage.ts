
import type { AuthUser, AuthTokens } from "../types/auth.types";

/* -------------------------------------------------------------------------- */
/* Storage Keys                                                               */
/* -------------------------------------------------------------------------- */

const STORAGE_KEYS = {
  USER: "crm-user",
  ACCESS_TOKEN: "crm-access-token",
  REFRESH_TOKEN: "crm-refresh-token",
} as const;

/* -------------------------------------------------------------------------- */
/* Safe Storage Helpers                                                       */
/* -------------------------------------------------------------------------- */

function setStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error("[AUTH_STORAGE_SET_ERROR]", error);
  }
}

function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("[AUTH_STORAGE_GET_ERROR]", error);
    return null;
  }
}

function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("[AUTH_STORAGE_REMOVE_ERROR]", error);
  }
}

/* -------------------------------------------------------------------------- */
/* User Storage                                                               */
/* -------------------------------------------------------------------------- */

export function saveUser(user: AuthUser): void {
  setStorageItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function getUser(): AuthUser | null {
  const rawUser = getStorageItem(STORAGE_KEYS.USER);

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch (error) {
    console.error("[AUTH_USER_PARSE_ERROR]", error);
    removeStorageItem(STORAGE_KEYS.USER);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Access Token                                                               */
/* -------------------------------------------------------------------------- */

export function saveAccessToken(token: string): void {
  setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, token);
}

export function getAccessToken(): string | null {
  return getStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/* -------------------------------------------------------------------------- */
/* Refresh Token                                                              */
/* -------------------------------------------------------------------------- */

export function saveRefreshToken(token?: string): void {
  if (!token) return;
  setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, token);
}

export function getRefreshToken(): string | null {
  return getStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/* -------------------------------------------------------------------------- */
/* Session Management                                                         */
/* -------------------------------------------------------------------------- */

export function setSession(user: AuthUser, tokens: AuthTokens): void {
  saveUser(user);
  saveAccessToken(tokens.accessToken);
  saveRefreshToken(tokens.refreshToken);
}

export const saveSession = setSession;

/* -------------------------------------------------------------------------- */
/* Session Getter                                                             */
/* -------------------------------------------------------------------------- */

export interface AuthSession {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export function getSession(): AuthSession {
  return {
    user: getUser(),
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
  };
}

/* -------------------------------------------------------------------------- */
/* Session Validation                                                         */
/* -------------------------------------------------------------------------- */

export function hasValidSession(): boolean {
  const accessToken = getAccessToken();

  return Boolean(accessToken);
}

export function isAuthenticated(): boolean {
  return hasValidSession();
}

/* -------------------------------------------------------------------------- */
/* Clear Session                                                              */
/* -------------------------------------------------------------------------- */

export function clearSession(): void {
  removeStorageItem(STORAGE_KEYS.USER);
  removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
  removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function clearUser(): void {
  clearSession();
}

/* -------------------------------------------------------------------------- */
/* Update User                                                                */
/* -------------------------------------------------------------------------- */

export function updateStoredUser(partial: Partial<AuthUser>): void {
  const currentUser = getUser();

  if (!currentUser) return;

  saveUser({
    ...currentUser,
    ...partial,
  });
}