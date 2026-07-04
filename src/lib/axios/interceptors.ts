import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { getAccessToken, refreshAccessToken } from "@/lib/auth/token-manager";
import { useAuthStore } from "@/store/auth-store";
import type { ApiErrorBody } from "@/types/api";

let initialized = false;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function getErrorMessage(error: AxiosError<ApiErrorBody>) {
  return (
    error.response?.data?.error?.message ??
    error.message ??
    "An unexpected error occurred"
  );
}

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  const pathname = window.location.pathname;

  if (pathname.startsWith(AUTH_ROUTES.login)) {
    return;
  }

  const loginUrl = new URL(AUTH_ROUTES.login, window.location.origin);
  loginUrl.searchParams.set("next", pathname);
  window.location.href = loginUrl.toString();
}

export function setupAxiosInterceptors() {
  if (initialized) {
    return;
  }

  apiClient.defaults.withCredentials = true;

  apiClient.interceptors.request.use(async (config) => {
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      config.headers.delete("Content-Type");
    }

    const token = await getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorBody>) => {
      const status = error.response?.status;
      const originalRequest = error.config as RetryableRequestConfig | undefined;

      if (
        status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes("/api/auth/")
      ) {
        originalRequest._retry = true;

        const refreshedToken = await refreshAccessToken();

        if (refreshedToken) {
          originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
          return apiClient(originalRequest);
        }

        useAuthStore.getState().clearAuth();
        redirectToLogin();
        return Promise.reject(error);
      }

      if (status === 401) {
        useAuthStore.getState().clearAuth();
        redirectToLogin();
      }

      if (status === 403) {
        console.error("[API] Forbidden:", getErrorMessage(error));
      }

      if (status && status >= 500) {
        console.error("[API] Server error:", getErrorMessage(error));
      }

      return Promise.reject(error);
    },
  );

  initialized = true;
}
