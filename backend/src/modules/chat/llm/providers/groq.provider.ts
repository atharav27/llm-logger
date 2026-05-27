import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import {
  ILlmProvider,
  LlmMetadata,
  LlmRequestParams,
  LlmStreamResult,
} from '../llm-provider.interface';

@Injectable()
export class GroqProvider implements ILlmProvider {
  private readonly logger = new Logger(GroqProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMessage(params: LlmRequestParams): Promise<LlmStreamResult> {
    const apiKey = this.configService.get<string>('llm.groqApiKey');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const controller = new AbortController();
    const defaultMaxTokens =
      this.configService.get<number>('llm.defaultMaxTokens') ?? 2048;

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

    const self = this;

    async function* generateStream(): AsyncIterable<string> {
      try {
        const stream = await client.chat.completions.create(
          {
            model: params.model,
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

        metadataResolve({
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          stopReason,
          requestId,
        });
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
        self.logger.error('Groq stream error', error);
        metadataReject(error);
        throw error;
      }
    }

    return {
      stream: generateStream(),
      metadata: metadataPromise,
      abort: () => controller.abort(),
    };
  }
}
