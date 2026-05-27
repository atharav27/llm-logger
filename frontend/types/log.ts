// types/log.ts

export type LogStatus = "success" | "error" | "pending";

export interface LLMLog {
  id: string;
  sessionId: string;
  model: string;
  provider: string;
  prompt: string;
  completion: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  costUsd: number;
  status: LogStatus;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: string; // ISO 8601
}

export interface LogsResponse {
  data: LLMLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LogFilters {
  search?: string;
  model?: string;
  provider?: string;
  status?: LogStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
