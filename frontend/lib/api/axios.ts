// lib/api/axios.ts
import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { unwrapEnvelope } from "./response";

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

const sharedConfig = {
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
};

/** Used only for POST /auth/refresh — no 401 retry interceptor */
export const refreshClient = axios.create(sharedConfig);

/** Main API client — envelope unwrap + 401 refresh/retry */
export const api = axios.create(sharedConfig);

function unwrapResponse<T>(response: AxiosResponse<T>): AxiosResponse<T> {
  response.data = unwrapEnvelope<T>(response.data);
  return response;
}

refreshClient.interceptors.response.use(unwrapResponse);

api.interceptors.response.use(unwrapResponse);

let isRefreshing = false;
let failedQueue: {
  resolve: (value: void) => void;
  reject: (reason: unknown) => void;
}[] = [];

function processQueue(error: unknown | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    if (
      !originalRequest ||
      originalRequest.skipAuthRetry ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      typeof window === "undefined"
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api.request(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { refreshAccessToken } = await import("./auth-refresh");
      await refreshAccessToken();
      processQueue(null);
      return api.request(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      const { forceLogout } = await import("./auth-refresh");
      await forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
