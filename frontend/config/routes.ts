// config/routes.ts

export const UI_ROUTES = {
  CHAT: "/chat",
  DASHBOARD: "/dashboard",
  LOGIN: "/login",
  LOGS: "/logs",
  SESSIONS: "/sessions",
  ANALYTICS: "/analytics",
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    REFRESH: "/api/v1/auth/refresh",
    LOGOUT: "/api/v1/auth/logout",
    ME: "/api/v1/users/me",
  },
  CONVERSATIONS: {
    LIST: "/api/v1/conversations",
    CREATE: "/api/v1/conversations",
    DETAIL: (id: string) => `/api/v1/conversations/${id}`,
    DELETE: (id: string) => `/api/v1/conversations/${id}`,
    STATUS: (id: string) => `/api/v1/conversations/${id}/status`,
    MESSAGE: (id: string) => `/api/v1/conversations/${id}/message`,
  },
  ANALYTICS: {
    OVERVIEW: "/api/v1/analytics/overview",
    TIMESERIES: "/api/v1/analytics/timeseries",
  },
  LLM: {
    CATALOG: "/api/v1/llm/catalog",
  },
} as const;
