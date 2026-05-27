// hooks/useLlmCatalog.ts
import { useQuery } from "@tanstack/react-query";
import { getLlmCatalog } from "@/lib/api/llm.api";
import type { LlmCatalog } from "@/types/llm";

/** Fetches the LLM provider/model catalog. Cached forever — it never changes at runtime. */
export function useLlmCatalog() {
  return useQuery({
    queryKey: ["llm-catalog"],
    queryFn: getLlmCatalog,
    staleTime: Infinity,  // catalog never changes between sessions
    gcTime: Infinity,
  });
}
