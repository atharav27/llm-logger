// lib/utils/format.ts
import { format } from "date-fns";

/**
 * Formats a token count into a compact string representation (e.g. 1200 -> 1.2k)
 */
export function formatTokens(count: number | undefined | null): string {
  if (count === undefined || count === null || isNaN(count)) return "0";
  if (count < 1000) return count.toLocaleString();
  return `${(count / 1000).toFixed(1)}k`;
}

/**
 * Formats a latency value in milliseconds into a readable string (e.g. 850 -> 850ms, 1250 -> 1.25s)
 */
export function formatLatency(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || isNaN(ms)) return "0ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Formats a USD amount into a detailed currency representation (e.g. 0.00342 -> $0.00342)
 */
export function formatCost(usd: number | undefined | null): string {
  if (usd === undefined || usd === null || isNaN(usd)) return "$0.00000";
  if (usd === 0) return "$0.00";
  if (usd < 0.01) {
    // Show up to 6 decimal places for small LLM API costs
    return `$${usd.toFixed(6)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(usd);
}

/**
 * Formats an ISO 8601 date string into a highly readable format
 */
export function formatDateTime(dateStr: string | undefined | null, pattern = "MMM d, yyyy h:mm:ss a"): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    return format(date, pattern);
  } catch {
    return "—";
  }
}
