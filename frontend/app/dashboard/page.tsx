"use client";

// app/dashboard/page.tsx
import React, { useState } from "react";
import { ChatShell } from "@/components/layout/ChatShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Layers, Coins, Zap, Activity, Loader2 } from "lucide-react";
import { useAnalyticsOverview, useAnalyticsTimeseries } from "@/hooks/useAnalytics";
import type { AnalyticsPeriod } from "@/types/analytics";
import { cn } from "@/lib/utils";
import { RecentConversationsTable } from "@/components/dashboard/RecentConversationsTable";

const PERIODS: { label: string; value: AnalyticsPeriod }[] = [
  { label: "Today", value: "today" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

function formatCost(val: string | number | undefined): string {
  if (val === undefined || val === null) return "—";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "—";
  if (n === 0) return "$0.00";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function formatNumber(val: number | undefined): string {
  if (val === undefined || val === null) return "—";
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toLocaleString();
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { data: overview, isLoading: loadingOverview } = useAnalyticsOverview(period);
  const { data: timeseries, isLoading: loadingTimeseries } = useAnalyticsTimeseries(period);

  const stats = [
    {
      label: "Total Requests",
      value: loadingOverview ? null : formatNumber(overview?.totalRequests),
      icon: ScrollText,
      description: "LLM API calls logged",
      color: "text-violet-400",
      bg: "bg-violet-600/10",
      border: "border-violet-500/10",
    },
    {
      label: "Conversations",
      value: loadingOverview ? null : formatNumber(overview?.totalConversations),
      icon: Layers,
      description: "Conversation threads",
      color: "text-blue-400",
      bg: "bg-blue-600/10",
      border: "border-blue-500/10",
    },
    {
      label: "Total Cost",
      value: loadingOverview ? null : formatCost(overview?.totalCostUsd),
      icon: Coins,
      description: "Estimated spend (USD)",
      color: "text-emerald-400",
      bg: "bg-emerald-600/10",
      border: "border-emerald-500/10",
    },
    {
      label: "Avg Latency",
      value: loadingOverview ? null : overview ? `${overview.avgLatencyMs}ms` : "—",
      icon: Zap,
      description: `${overview?.successRate ?? 0}% success rate`,
      color: "text-amber-400",
      bg: "bg-amber-600/10",
      border: "border-amber-500/10",
    },
  ];

  // Find max for chart scaling
  const points = timeseries?.points ?? [];
  const maxRequests = Math.max(...points.map((p) => p.requests), 1);

  return (
    <ChatShell>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
              <p className="text-sm text-zinc-400 mt-1">Overview of your LLM API activity</p>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                    period === p.value
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, description, color, bg, border }) => (
              <Card key={label} className="bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 transition-colors relative overflow-hidden">
                <div className={`absolute inset-x-0 top-0 h-[1px] ${bg} opacity-50`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">{label}</CardTitle>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} border ${border}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {value === null ? (
                    <div className="h-9 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-white">{value}</div>
                  )}
                  <p className="text-xs text-zinc-500 mt-1">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-400" />
                <CardTitle className="text-base text-white">Requests Over Time</CardTitle>
              </div>
              {loadingTimeseries && <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />}
            </CardHeader>
            <CardContent>
              {points.length > 0 ? (
                <div className={cn(
                  "flex items-end gap-[2px] h-52 w-full",
                  points.length <= 3 ? "justify-center" : ""
                )}>
                  {points.map((point) => {
                    const heightPct = maxRequests > 0 ? (point.requests / maxRequests) * 100 : 0;
                    const hasData = point.requests > 0;
                    // Cap bar width when there are very few data points
                    const barMaxWidth = points.length <= 3 ? "80px" : points.length <= 7 ? "48px" : undefined;
                    return (
                      <div
                        key={point.date}
                        className="flex-1 flex flex-col items-center justify-end group relative h-full"
                        style={barMaxWidth ? { maxWidth: barMaxWidth } : undefined}
                      >
                        {/* Count label above bar */}
                        {hasData && (
                          <span className="text-[10px] text-zinc-500 mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {point.requests}
                          </span>
                        )}
                        <div
                          className={cn(
                            "w-full rounded-t transition-all duration-300 cursor-default",
                            hasData
                              ? "bg-gradient-to-t from-violet-600 to-violet-400 hover:from-violet-500 hover:to-violet-300 shadow-sm shadow-violet-500/20"
                              : "bg-zinc-800/40"
                          )}
                          style={{ height: hasData ? `${Math.max(heightPct, 6)}%` : "2px" }}
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 whitespace-nowrap pointer-events-none z-10 shadow-xl">
                          <span className="font-medium text-white">{point.requests}</span>
                          <span className="text-zinc-500 ml-1">req · {point.date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center">
                  {loadingTimeseries ? (
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
                  ) : (
                    <p className="text-sm text-zinc-500">No data for this period yet</p>
                  )}
                </div>
              )}
              {/* X-axis labels — show first, middle, last */}
              {points.length > 0 && (
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-zinc-600">{points[0]?.date}</span>
                  <span className="text-xs text-zinc-600">{points[Math.floor(points.length / 2)]?.date}</span>
                  <span className="text-xs text-zinc-600">{points[points.length - 1]?.date}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Token / Cost summary */}
          {overview && !loadingOverview && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Messages", value: formatNumber(overview.totalMessages), sub: "User + assistant turns" },
                { label: "Total Tokens", value: formatNumber(overview.totalTokensUsed), sub: "Input + output combined" },
                { label: "Success Rate", value: `${overview.successRate}%`, sub: `${overview.totalRequests} total requests` },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 mb-1">{label}</p>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recent Conversations Table */}
          <RecentConversationsTable />

        </div>
      </div>
    </ChatShell>
  );
}
