// lib/api/auth-refresh.ts — single-flight refresh using HttpOnly cookies on the API origin
import { API_ROUTES, UI_ROUTES } from "@/config/routes";
import { clearSessionFlag } from "@/lib/auth/session";

import { refreshClient } from "./axios";

let refreshPromise: Promise<void> | null = null;

/** POST /auth/refresh — relies on ai-bot_user_refresh HttpOnly cookie */
export function refreshAccessToken(): Promise<void> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const { data } = await refreshClient.post<{ accessToken?: string }>(
      API_ROUTES.AUTH.REFRESH
    );

    if (!data?.accessToken) {
      throw new Error("Refresh response missing access token");
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/** Clear client session and redirect to login */
export async function forceLogout(): Promise<void> {
  clearSessionFlag();

  if (typeof window !== "undefined") {
    const { useAuthStore } = await import("@/lib/stores/auth.store");
    useAuthStore.getState().logout();

    if (window.location.pathname !== UI_ROUTES.LOGIN) {
      window.location.href = UI_ROUTES.LOGIN;
    }
  }
}
