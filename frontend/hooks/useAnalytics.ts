// hooks/useAnalytics.ts
import { useQuery } from "@tanstack/react-query";
import { getAnalyticsOverview, getAnalyticsTimeseries } from "@/lib/api/analytics.api";
import type { AnalyticsPeriod } from "@/types/analytics";

export const analyticsKeys = {
  all: ["analytics"] as const,
  overview: (period: AnalyticsPeriod) => ["analytics", "overview", period] as const,
  timeseries: (period: AnalyticsPeriod) => ["analytics", "timeseries", period] as const,
};

/** KPI cards — total conversations, messages, tokens, cost, latency, success rate */
export function useAnalyticsOverview(period: AnalyticsPeriod = "30d") {
  return useQuery({
    queryKey: analyticsKeys.overview(period),
    queryFn: () => getAnalyticsOverview(period),
    staleTime: 60_000,   // 1 min — analytics don't need to be real-time
  });
}

/** Daily chart data points for the given period */
export function useAnalyticsTimeseries(period: AnalyticsPeriod = "30d") {
  return useQuery({
    queryKey: analyticsKeys.timeseries(period),
    queryFn: () => getAnalyticsTimeseries(period),
    staleTime: 60_000,
  });
}
