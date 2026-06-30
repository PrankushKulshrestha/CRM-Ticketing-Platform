
/*
|--------------------------------------------------------------------------
| User Roles (RBAC Core)
|--------------------------------------------------------------------------
| Immutable system roles
|--------------------------------------------------------------------------
*/

export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  AGENT: "agent",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/*
|--------------------------------------------------------------------------
| JWT Payload (Single Source of Truth)
|--------------------------------------------------------------------------
| MUST remain consistent across:
| auth service, middleware, controllers
|--------------------------------------------------------------------------
*/

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/*
|--------------------------------------------------------------------------
| Auth User (Public API Shape)
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

/*
|--------------------------------------------------------------------------
| Auth Input DTOs
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Token Types
|--------------------------------------------------------------------------
*/

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/*
|--------------------------------------------------------------------------
| Standard API Response Wrapper
|--------------------------------------------------------------------------
*/

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/*
|--------------------------------------------------------------------------
| Auth Responses (Normalized)
|--------------------------------------------------------------------------
*/

export type LoginResponse = ApiResponse<{
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}>;

export type RegisterResponse = ApiResponse<{
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}>;

export type RefreshTokenResponse = ApiResponse<{
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
}>;

export type CurrentUserResponse = ApiResponse<{
  user: AuthUser;
}>;

export type LogoutResponse = ApiResponse<null>;

/*
|--------------------------------------------------------------------------
| Authenticated Request
|--------------------------------------------------------------------------
| FIX (duplication reduction): removed — this was a second, divergent
| AuthenticatedRequest ({ user?: JwtPayload }) competing with the one in
| auth.middleware.ts ({ user?: AuthUser }), which is what every real
| consumer (ticket.controller.ts, rbac.middleware.ts, and now
| auth.controller.ts) actually imports. Import from
| "../middlewares/auth.middleware" instead.
|--------------------------------------------------------------------------
*/