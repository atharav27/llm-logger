import { BadRequestException } from '@nestjs/common';
import { Provider } from '@prisma/client';

export const DEFAULT_PROVIDER = Provider.GROQ;

export const DEFAULT_MODEL_BY_PROVIDER: Record<Provider, string> = {
  [Provider.GEMINI]: 'gemini-2.0-flash',
  [Provider.GROQ]: 'llama-3.3-70b-versatile',
  [Provider.OPENROUTER]: 'deepseek/deepseek-v4-flash:free',
};

export const ALLOWED_MODELS: Record<Provider, readonly string[]> = {
  [Provider.GEMINI]: [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ],
  [Provider.GROQ]: ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b'],
  [Provider.OPENROUTER]: [
    'deepseek/deepseek-v4-flash:free',
    'google/gemma-4-31b-it:free',
  ],
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  [Provider.GEMINI]: 'Gemini',
  [Provider.GROQ]: 'Groq',
  [Provider.OPENROUTER]: 'OpenRouter',
};

export const MODEL_LABELS: Record<string, string> = {
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-flash-8b': 'Gemini 1.5 Flash 8B',
  'llama-3.3-70b-versatile': 'Llama 3.3 70B',
  'openai/gpt-oss-120b': 'GPT-OSS 120B',
  'deepseek/deepseek-v4-flash:free': 'DeepSeek V4 Flash (Free)',
  'google/gemma-4-31b-it:free': 'Gemma 4 31B (Free)',
};

export interface ResolvedLlmSelection {
  provider: Provider;
  model: string;
}

export function isAllowedModel(provider: Provider, model: string): boolean {
  return ALLOWED_MODELS[provider]?.includes(model) ?? false;
}

export function resolveProviderModel(
  provider?: Provider,
  model?: string,
): ResolvedLlmSelection {
  const resolvedProvider = provider ?? DEFAULT_PROVIDER;
  const resolvedModel = model ?? DEFAULT_MODEL_BY_PROVIDER[resolvedProvider];

  if (!isAllowedModel(resolvedProvider, resolvedModel)) {
    throw new BadRequestException(
      `Model "${resolvedModel}" is not allowed for provider ${resolvedProvider}`,
    );
  }

  return { provider: resolvedProvider, model: resolvedModel };
}

export function resolveMessageProviderModel(
  conversationProvider: Provider,
  conversationModel: string,
  bodyProvider?: Provider,
  bodyModel?: string,
): ResolvedLlmSelection {
  const hasProvider = bodyProvider !== undefined;
  const hasModel = bodyModel !== undefined;

  if (hasProvider !== hasModel) {
    throw new BadRequestException(
      'provider and model must both be provided or both omitted',
    );
  }

  if (hasProvider && hasModel) {
    return resolveProviderModel(bodyProvider, bodyModel);
  }

  return resolveProviderModel(conversationProvider, conversationModel);
}

export function buildCatalogResponse() {
  const providers = (Object.values(Provider) as Provider[]).map((id) => ({
    id,
    name: PROVIDER_LABELS[id],
    models: ALLOWED_MODELS[id].map((modelId) => ({
      id: modelId,
      name: MODEL_LABELS[modelId] ?? modelId,
    })),
  }));

  return {
    defaultProvider: DEFAULT_PROVIDER,
    defaultModel: DEFAULT_MODEL_BY_PROVIDER[DEFAULT_PROVIDER],
    providers,
  };
}
