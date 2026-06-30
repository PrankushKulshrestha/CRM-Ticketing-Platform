
// src/features/auth/api/authApi.ts

import { apiClient } from "@/lib/api/apiClient";

import type {
  AuthUser,
  CurrentUserResponse,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  RefreshTokenResponse,
  RegisterPayload,
  RegisterResponse,
} from "../types/auth.types";

/* -------------------------------------------------------------------------- */
/* Auth API                                                                   */
/* -------------------------------------------------------------------------- */

export const authApi = {
  /* ------------------------------------------------------------------------ */
  /* Login                                                                     */
  /* ------------------------------------------------------------------------ */

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );

    return response;
  },

  /* ------------------------------------------------------------------------ */
  /* Register                                                                  */
  /* ------------------------------------------------------------------------ */

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      "/auth/register",
      payload,
    );

    return response;
  },

  /* ------------------------------------------------------------------------ */
  /* Current User                                                              */
  /* ------------------------------------------------------------------------ */

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<CurrentUserResponse>("/auth/me");

    return response.user;
  },

  /* ------------------------------------------------------------------------ */
  /* Logout                                                                    */
  /* ------------------------------------------------------------------------ */

  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>("/auth/logout");

    return response;
  },

  /* ------------------------------------------------------------------------ */
  /* Refresh Token                                                             */
  /* ------------------------------------------------------------------------ */

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>(
      "/auth/refresh",
      {
        refreshToken,
      },
    );

    return response;
  },
};

/* -------------------------------------------------------------------------- */
/* Named Exports                                                              */
/* -------------------------------------------------------------------------- */

export const { login, register, logout, getCurrentUser, refreshToken } =
  authApi;

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default authApi;