import { GoogleGenAI } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ILlmProvider,
  LlmMetadata,
  LlmRequestParams,
  LlmStreamResult,
} from '../llm-provider.interface';

@Injectable()
export class GeminiProvider implements ILlmProvider {
  private readonly client: GoogleGenAI;
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly defaultMaxTokens: number;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.get<string>('GEMINI_API_KEY') ?? '',
    });
    this.defaultMaxTokens =
      this.configService.get<number>('llm.defaultMaxTokens') ?? 2048;
  }

  async sendMessage(params: LlmRequestParams): Promise<LlmStreamResult> {
    let aborted = false;
    const requestStart = Date.now();

    let metadataResolve!: (value: LlmMetadata) => void;

    const metadataPromise = new Promise<LlmMetadata>((resolve) => {
      metadataResolve = resolve;
    });

    const conversationMessages = params.messages.filter(
      (m) => m.role !== 'system',
    );

    const firstUserIndex = conversationMessages.findIndex(
      (m) => m.role === 'user',
    );
    const cleanMessages =
      firstUserIndex >= 0
        ? conversationMessages.slice(firstUserIndex)
        : conversationMessages;

    if (cleanMessages.length === 0) {
      throw new Error('No user message in context');
    }

    const contents = cleanMessages.map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }));
    const client = this.client;
    const logger = this.logger;
    const defaultMaxTokens = this.defaultMaxTokens;

    async function* generateStream(): AsyncIterable<string> {
      try {
        const model = params.model.startsWith('models/')
          ? params.model
          : `models/${params.model}`;

        const response = await client.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: params.systemPrompt,
            maxOutputTokens: params.maxTokens ?? defaultMaxTokens,
            temperature: params.temperature ?? 0.7,
          },
        });

        let inputTokens = 0;
        let outputTokens = 0;
        let stopReason = 'STOP';

        for await (const chunk of response) {
          if (aborted) {
            break;
          }

          const text = chunk.text;
          if (text) {
            yield text;
          }

          if (chunk.usageMetadata) {
            inputTokens = chunk.usageMetadata.promptTokenCount ?? 0;
            outputTokens = chunk.usageMetadata.candidatesTokenCount ?? 0;
          }

          if (chunk.candidates?.[0]?.finishReason) {
            stopReason = chunk.candidates[0].finishReason;
          }
        }

        if (aborted) {
          metadataResolve({
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            stopReason: 'cancelled',
          });
          return;
        }

        metadataResolve({
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          stopReason,
          requestId: undefined,
        });
      } catch (error) {
        if (aborted) {
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
          status?: unknown;
          errorDetails?: unknown;
          stack?: string;
        };
        logger.error('Gemini stream error', {
          message: err?.message,
          status: err?.status,
          details: err?.errorDetails,
          stack: err?.stack,
          latencyMs: Date.now() - requestStart,
        });

        // IMPORTANT:
        // Never reject metadataPromise.
        // When the raw stream throws early, LlmService will not await `metadata`,
        // so a rejected promise can become an unhandled rejection and crash Node.
        metadataResolve({
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          stopReason: 'error',
          requestId: undefined,
        });
        throw error;
      }
    }

    return {
      stream: generateStream(),
      metadata: metadataPromise,
      abort: () => {
        aborted = true;
      },
    };
  }
}
