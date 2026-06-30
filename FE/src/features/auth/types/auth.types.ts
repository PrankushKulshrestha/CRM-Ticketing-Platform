
// src/features/auth/types/auth.types.ts

export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  AGENT: "agent",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/*
|--------------------------------------------------------------------------
| AuthUser - MUST match backend types/auth.types.ts AuthUser shape.
| Field is `userId` (not `id`), matching the JWT payload and the
| /auth/me, /auth/login, /auth/refresh response `user` objects.
|--------------------------------------------------------------------------
*/
export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;

  avatar?: string | null;
  isActive?: boolean | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
}

export interface CurrentUserResponse {
  success: boolean;
  user: AuthUser;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}