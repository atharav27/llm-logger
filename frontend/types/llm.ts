// types/llm.ts
import type { Provider } from "./conversation";

export interface LlmModel {
  id: string;   // e.g. "gemini-2.0-flash"
  name: string; // e.g. "Gemini 2.0 Flash"
}

export interface LlmProvider {
  id: Provider;
  name: string; // "Gemini" | "Groq"
  models: LlmModel[];
}

/** Response from GET /llm/catalog */
export interface LlmCatalog {
  defaultProvider: Provider;
  defaultModel: string;
  providers: LlmProvider[];
}
