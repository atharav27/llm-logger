// types/session.ts

export interface LLMSession {
  id: string;
  name?: string;
  totalLogs: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  models: string[];
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface SessionsResponse {
  data: LLMSession[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SessionFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
