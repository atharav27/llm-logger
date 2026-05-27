// config/constants.ts

/** Non-secret session hint for Next.js proxy (API auth uses HttpOnly cookies on :3000) */
export const COOKIE_KEYS = {
  SESSION_FLAG: "llm_session",
} as const;

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  PAGE_SIZE: 20,
} as const;

/** Matches Prisma Provider enum — prefer GET /api/v1/llm/catalog at runtime */
export const DEFAULT_PROVIDER = "GROQ" as const;
export const DEFAULT_MODEL = "llama-3.3-70b-versatile" as const;

export const LLM_PROVIDERS = [
  { id: "GEMINI", name: "Gemini" },
  { id: "GROQ", name: "Groq" },
] as const;

export const LLM_MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "GEMINI" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "GEMINI" },
  { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash 8B", provider: "GEMINI" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "GROQ" },
  { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B", provider: "GROQ" },
] as const;
