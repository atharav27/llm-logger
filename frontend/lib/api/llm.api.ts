// lib/api/llm.api.ts
import { apiFetch } from "./client";
import { API_ROUTES } from "@/config/routes";
import type { LlmCatalog } from "@/types/llm";

/** GET /api/v1/llm/catalog — available providers and models */
export function getLlmCatalog(): Promise<LlmCatalog> {
  return apiFetch<LlmCatalog>(API_ROUTES.LLM.CATALOG, { method: "GET" });
}
