export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gemini-2.0-flash': { inputPer1M: 0.1, outputPer1M: 0.4 },
  'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.3 },
  'gemini-1.5-flash-8b': { inputPer1M: 0.0375, outputPer1M: 0.15 },
  'llama-3.3-70b-versatile': { inputPer1M: 0, outputPer1M: 0 },
  'openai/gpt-oss-120b': { inputPer1M: 0, outputPer1M: 0 },
  'deepseek/deepseek-v4-flash:free': { inputPer1M: 0, outputPer1M: 0 },
  'google/gemma-4-31b-it:free': { inputPer1M: 0, outputPer1M: 0 },
};

const DEFAULT_PRICING: ModelPricing = { inputPer1M: 0.1, outputPer1M: 0.4 };

export function calculateCost(
  model: string,
  inputTokens: number | null | undefined,
  outputTokens: number | null | undefined,
): number {
  if (!inputTokens && !outputTokens) {
    return 0;
  }

  const pricing = MODEL_PRICING[model] ?? DEFAULT_PRICING;
  const inputCost = ((inputTokens ?? 0) / 1_000_000) * pricing.inputPer1M;
  const outputCost = ((outputTokens ?? 0) / 1_000_000) * pricing.outputPer1M;

  return Math.round((inputCost + outputCost) * 1e8) / 1e8;
}
