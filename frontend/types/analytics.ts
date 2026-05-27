// types/analytics.ts

export type AnalyticsPeriod = "today" | "7d" | "30d" | "90d";

/** Response from GET /analytics/overview */
export interface AnalyticsOverview {
  period: AnalyticsPeriod;
  from: string;   // ISO date string
  to: string;     // ISO date string
  totalConversations: number;
  totalMessages: number;
  totalRequests: number;
  totalTokensUsed: number;
  totalCostUsd: string;  // Decimal as string e.g. "0.042000"
  avgLatencyMs: number;
  successRate: number;   // 0–100 percentage
}

/** Single point in the timeseries chart */
export interface TimeseriesPoint {
  date: string;     // "YYYY-MM-DD"
  requests: number;
  tokens: number;
}

/** Response from GET /analytics/timeseries */
export interface TimeseriesResponse {
  period: AnalyticsPeriod;
  granularity: "day";
  points: TimeseriesPoint[];
}
