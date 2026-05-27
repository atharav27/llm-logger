import { registerAs } from '@nestjs/config';

export default registerAs('llm', () => ({
  geminiApiKey: process.env.GEMINI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  contextWindow: parseInt(process.env.CONTEXT_WINDOW ?? '20', 10),
  defaultMaxTokens: parseInt(process.env.LLM_DEFAULT_MAX_TOKENS ?? '2048', 10),
}));
