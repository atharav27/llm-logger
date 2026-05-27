// lib/api/analytics.api.ts
import { apiFetch } from "./client";
import { API_ROUTES } from "@/config/routes";
import type { AnalyticsOverview, AnalyticsPeriod, TimeseriesResponse } from "@/types/analytics";

/** GET /api/v1/analytics/overview — KPI cards */
export function getAnalyticsOverview(
  period: AnalyticsPeriod = "30d"
): Promise<AnalyticsOverview> {
  return apiFetch<AnalyticsOverview>(API_ROUTES.ANALYTICS.OVERVIEW, {
    method: "GET",
    params: { period },
  });
}

/** GET /api/v1/analytics/timeseries — daily chart data */
export function getAnalyticsTimeseries(
  period: AnalyticsPeriod = "30d"
): Promise<TimeseriesResponse> {
  return apiFetch<TimeseriesResponse>(API_ROUTES.ANALYTICS.TIMESERIES, {
    method: "GET",
    params: { period },
  });
}
