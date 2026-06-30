
// src/lib/api/apiClient.ts

import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import type { AuthUser } from "@/features/auth/types/auth.types";

import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
} from "@/features/auth/utils/authStorage";

import routes from "@/config/routes";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface RefreshResponse {
  user: AuthUser;

  accessToken: string;

  refreshToken?: string;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/* -------------------------------------------------------------------------- */
/* API Base URL                                                               */
/* -------------------------------------------------------------------------- */

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1";

/* -------------------------------------------------------------------------- */
/* Axios Instance                                                             */
/* -------------------------------------------------------------------------- */

const axiosInstance = axios.create({
  baseURL: BASE_URL,

  timeout: 30_000,

  headers: {
    "Content-Type": "application/json",
  },

  withCredentials: true,
});

/* -------------------------------------------------------------------------- */
/* Request Interceptor                                                        */
/* -------------------------------------------------------------------------- */

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token) {
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }

      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  },

  (error: unknown) => Promise.reject(error),
);

/* -------------------------------------------------------------------------- */
/* Refresh Queue                                                              */
/* -------------------------------------------------------------------------- */

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;

  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    if (token) {
      resolve(token);
    }
  });

  failedQueue = [];
}

/* -------------------------------------------------------------------------- */
/* Response Interceptor                                                       */
/* -------------------------------------------------------------------------- */

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    const isRefreshRequest =
      originalRequest.url?.includes("/auth/refresh") ?? false;

    if (status === 401 && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;

      /* -------------------------------------------------------------------- */
      /* Queue Requests During Refresh                                        */
      /* -------------------------------------------------------------------- */

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (!originalRequest.headers) {
                originalRequest.headers = new AxiosHeaders();
              }

              originalRequest.headers.set("Authorization", `Bearer ${token}`);

              resolve(axiosInstance(originalRequest));
            },

            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const currentRefreshToken = getRefreshToken();

        if (!currentRefreshToken) {
          processQueue(error);
          // No refresh token — reject and let AuthProvider handle navigation.
          // Do not hard-redirect from the interceptor.
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken: currentRefreshToken },
          { withCredentials: true },
        );

        const payload = response.data?.data ?? response.data;
        if (!payload) throw new Error("Refresh response payload missing");

        const { user, accessToken, refreshToken: newRefreshToken } = payload;
        if (!user || !accessToken) throw new Error("Invalid refresh response");

        setSession(user, {
          accessToken,
          refreshToken: newRefreshToken ?? currentRefreshToken,
        });

        processQueue(null, accessToken);

        if (!originalRequest.headers) {
          originalRequest.headers = new AxiosHeaders();
        }
        originalRequest.headers.set("Authorization", `Bearer ${accessToken}`);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Bug fix: do NOT hard-redirect here. The interceptor runs during
        // AuthProvider hydration; a redirect at this point races with the
        // provider's own refresh attempt and causes agents (whose tokens
        // expire sooner) to be logged out while admins (recently active)
        // survive. AuthProvider.refreshSession() owns the clearSession +
        // redirect decision — just reject so it can handle it.
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/* -------------------------------------------------------------------------- */
/* Typed Wrapper Layer                                                        */
/* -------------------------------------------------------------------------- */
/*
 * The raw axios instance (axiosInstance) resolves to AxiosResponse<T>.
 * Every feature API in this codebase is written against the assumption
 * that apiClient.get/post/put/patch/delete resolve directly to T (the
 * response body), not the AxiosResponse envelope. Rather than touch every
 * call site, this thin wrapper preserves the exact same method names/
 * generics/call signatures while unwrapping `.data` once, here, in one
 * place. Interceptors, auth refresh logic, headers, and BASE_URL above are
 * untouched — this only changes what the public surface returns.
 */

export const apiClient = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.get<T>(url, config).then((response) => response.data);
  },

  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return axiosInstance
      .post<T>(url, data, config)
      .then((response) => response.data);
  },

  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return axiosInstance
      .put<T>(url, data, config)
      .then((response) => response.data);
  },

  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return axiosInstance
      .patch<T>(url, data, config)
      .then((response) => response.data);
  },

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance
      .delete<T>(url, config)
      .then((response) => response.data);
  },
};

export default apiClient;