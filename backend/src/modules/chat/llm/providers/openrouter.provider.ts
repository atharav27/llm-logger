import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import {
  ILlmProvider,
  LlmMetadata,
  LlmRequestParams,
  LlmStreamResult,
} from '../llm-provider.interface';

const OPENROUTER_FALLBACK_MODELS: Record<string, string> = {
  'deepseek/deepseek-v4-flash:free': 'google/gemma-4-31b-it:free',
  'google/gemma-4-31b-it:free': 'deepseek/deepseek-v4-flash:free',
};

@Injectable()
export class OpenRouterProvider implements ILlmProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMessage(params: LlmRequestParams): Promise<LlmStreamResult> {
    const apiKey = this.configService.get<string>('llm.openRouterApiKey');
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'LLM Logger',
      },
    });

    const controller = new AbortController();
    const defaultMaxTokens =
      this.configService.get<number>('llm.defaultMaxTokens') ?? 2048;
    const logger = this.logger;

    let metadataResolve!: (value: LlmMetadata) => void;
    let metadataReject!: (reason: unknown) => void;

    const metadataPromise = new Promise<LlmMetadata>((resolve, reject) => {
      metadataResolve = resolve;
      metadataReject = reject;
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }

    for (const m of params.messages.filter((msg) => msg.role !== 'system')) {
      messages.push({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      });
    }

    async function* generateStream(): AsyncIterable<string> {
      const fallbackModel = OPENROUTER_FALLBACK_MODELS[params.model];
      const modelAttempts = fallbackModel
        ? [params.model, fallbackModel]
        : [params.model];

      for (let attempt = 0; attempt < modelAttempts.length; attempt++) {
        const model = modelAttempts[attempt];
        let emittedContent = false;

        try {
          const stream = await client.chat.completions.create(
            {
              model,
              max_tokens: params.maxTokens ?? defaultMaxTokens,
              temperature: params.temperature ?? 0.7,
              messages,
              stream: true,
              stream_options: { include_usage: true },
            },
            { signal: controller.signal },
          );

          let inputTokens = 0;
          let outputTokens = 0;
          let stopReason = 'stop';
          let requestId = '';

          for await (const chunk of stream) {
            requestId = chunk.id;

            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              emittedContent = true;
              yield content;
            }

            if (chunk.choices[0]?.finish_reason) {
              stopReason = chunk.choices[0].finish_reason;
            }

            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens;
              outputTokens = chunk.usage.completion_tokens;
            }
          }

          if (attempt > 0) {
            const primaryModel = modelAttempts[0];
            const fallbackUsed = modelAttempts[attempt];
            logger.warn(
              `OpenRouter fallback model used: ${primaryModel} -> ${fallbackUsed}`,
            );
          }

          metadataResolve({
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            stopReason,
            requestId,
          });
          return;
        } catch (error) {
          if (controller.signal.aborted) {
            metadataResolve({
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              stopReason: 'cancelled',
            });
            return;
          }

          const err = error as {
            message?: string;
            status?: number;
            code?: string;
            type?: string;
            request_id?: string;
            error?: unknown;
            stack?: string;
          };

          const canRetryWithFallback =
            attempt === 0 && modelAttempts.length > 1 && !emittedContent;

          logger.error('OpenRouter stream error', {
            message: err?.message,
            status: err?.status,
            code: err?.code,
            type: err?.type,
            requestId: err?.request_id,
            model,
            willRetryWithFallback: canRetryWithFallback,
            fallbackModel: canRetryWithFallback ? modelAttempts[1] : undefined,
            details: err?.error,
            stack: err?.stack,
          });

          if (canRetryWithFallback) {
            logger.warn(
              `Retrying OpenRouter request with fallback model ${modelAttempts[1]} after failure on ${model}`,
            );
            continue;
          }

          metadataReject(error);
          throw error;
        }
      }
    }

    return {
      stream: generateStream(),
      metadata: metadataPromise,
      abort: () => controller.abort(),
    };
  }
}
