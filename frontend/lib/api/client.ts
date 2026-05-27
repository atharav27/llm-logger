// lib/api/client.ts
import axios, { type Method } from "axios";

import { api } from "./axios";
import { getErrorMessage } from "./response";

export interface FetchOptions extends Omit<RequestInit, "body"> {
  params?: object;
  body?: unknown;
  /** Skip 401 → refresh → retry (login, register, refresh) */
  skipAuthRetry?: boolean;
  /** @internal */
  _authRetried?: boolean;
}

export type ApiError = Error & {
  status?: number;
  data?: unknown;
};

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const apiError = new Error(getErrorMessage(error)) as ApiError;
    apiError.status = error.response?.status;
    apiError.data = error.response?.data;
    return apiError;
  }

  if (error instanceof Error) {
    return error as ApiError;
  }

  return new Error(getErrorMessage(error)) as ApiError;
}

/**
 * Thin wrapper around the shared Axios instance.
 * HttpOnly cookies via withCredentials; 401 refresh handled by interceptors.
 */
export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    params,
    body,
    skipAuthRetry,
    _authRetried,
    method = "GET",
    headers,
    signal,
    ...rest
  } = options;

  try {
    const { data } = await api.request<T>({
      url: path,
      method: method as Method,
      params,
      data: body,
      headers: headers as Record<string, string> | undefined,
      signal: signal ?? undefined,
      skipAuthRetry,
      _retry: _authRetried,
      ...rest,
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export { api } from "./axios";
export default apiFetch;
