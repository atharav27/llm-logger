import { Provider } from '@prisma/client';

export type LlmProviderEnum = Provider;

export interface LlmMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LlmRequestParams {
  provider: LlmProviderEnum;
  model: string;
  messages: LlmMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LlmMetadata {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  stopReason: string;
  requestId?: string;
}

export interface LlmStreamResult {
  stream: AsyncIterable<string>;
  metadata: Promise<LlmMetadata>;
  abort: () => void;
}

export interface ILlmProvider {
  sendMessage(params: LlmRequestParams): Promise<LlmStreamResult>;
}

export const SUPPORTED_PROVIDERS: Provider[] = [
  Provider.GEMINI,
  Provider.GROQ,
  Provider.OPENROUTER,
];
