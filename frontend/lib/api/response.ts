// lib/api/response.ts
import axios from "axios";

/** Unwrap NestJS global response interceptor envelope */
export function unwrapEnvelope<T>(data: unknown): T {
  if (
    data &&
    typeof data === "object" &&
    "statusCode" in data &&
    "message" in data &&
    "data" in data
  ) {
    return (data as { data: T }).data;
  }
  return data as T;
}

function isNestEnvelope(
  data: unknown
): data is { statusCode: number; message: string; data: unknown } {
  return (
    !!data &&
    typeof data === "object" &&
    "statusCode" in data &&
    "message" in data &&
    "data" in data
  );
}

/** Normalize API errors for UI (login, register, toasts) */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (isNestEnvelope(data)) {
      return data.message || error.message;
    }
    if (data && typeof data === "object" && "message" in data) {
      const msg = (data as { message: unknown }).message;
      if (typeof msg === "string") return msg;
      if (Array.isArray(msg)) return msg.join(", ");
    }
    return error.message;
  }

  if (error instanceof Error) {
    const withData = error as Error & { data?: { message?: string } };
    return withData.data?.message ?? error.message;
  }

  return "An unexpected error occurred";
}
