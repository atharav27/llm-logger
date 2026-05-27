import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogStatus, Provider } from '@prisma/client';

import { PrismaService } from 'src/common/database/prisma.service';
import { IngestService } from 'src/modules/ingest/ingest.service';

import {
  ILlmProvider,
  LlmProviderEnum,
  LlmMetadata,
  LlmRequestParams,
  SUPPORTED_PROVIDERS,
} from './llm-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';

export interface SendMessageOptions {
  conversationId: string;
  params: LlmRequestParams;
}

export interface EnrichedStream {
  stream: AsyncIterable<string>;
  abort: () => void;
  logId: string;
}

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);
  private providers!: Map<LlmProviderEnum, ILlmProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestService: IngestService,
    private readonly configService: ConfigService,
    private readonly geminiProvider: GeminiProvider,
    private readonly groqProvider: GroqProvider,
    private readonly openRouterProvider: OpenRouterProvider,
  ) {}

  onModuleInit(): void {
    const map = new Map<LlmProviderEnum, ILlmProvider>();

    if (this.configService.get<string>('llm.geminiApiKey')) {
      map.set(Provider.GEMINI, this.geminiProvider);
    } else {
      this.logger.warn('GEMINI_API_KEY not set — Gemini provider unavailable');
    }

    if (this.configService.get<string>('llm.groqApiKey')) {
      map.set(Provider.GROQ, this.groqProvider);
    } else {
      this.logger.warn('GROQ_API_KEY not set — Groq provider unavailable');
    }

    if (this.configService.get<string>('llm.openRouterApiKey')) {
      map.set(Provider.OPENROUTER, this.openRouterProvider);
    } else {
      this.logger.warn(
        'OPENROUTER_API_KEY not set — OpenRouter provider unavailable',
      );
    }

    this.providers = map;
  }

  async sendMessage(options: SendMessageOptions): Promise<EnrichedStream> {
    const { conversationId, params } = options;

    if (!SUPPORTED_PROVIDERS.includes(params.provider)) {
      throw new BadRequestException(
        `Unsupported provider: ${params.provider}. Supported: ${SUPPORTED_PROVIDERS.join(', ')}`,
      );
    }

    const provider = this.providers.get(params.provider);
    if (!provider) {
      throw new BadRequestException(
        `Provider ${params.provider} is not configured. Set the API key in environment variables.`,
      );
    }

    const lastUserMsg = [...params.messages]
      .reverse()
      .find((m) => m.role === 'user');

    const pendingLog = await this.prisma.inferenceLog.create({
      data: {
        conversationId,
        provider: params.provider,
        model: params.model,
        status: LogStatus.PENDING,
        requestAt: new Date(),
        isStreaming: true,
        inputPreview: lastUserMsg?.content?.slice(0, 200) ?? '',
      },
    });

    const logId = pendingLog.id;
    const requestStart = Date.now();
    let timeToFirstToken: number | null = null;

    const {
      stream: rawStream,
      metadata,
      abort: providerAbort,
    } = await provider.sendMessage(params);

    // Defensive: metadata is only awaited on the success path.
    // If a provider rejects metadata early, it can otherwise become an unhandled rejection.
    const safeMetadata = metadata.catch(
      (): LlmMetadata => ({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        stopReason: 'error',
        requestId: undefined,
      }),
    );

    let aborted = false;
    const ingestService = this.ingestService;
    const logger = this.logger;

    async function* enrichedStream(): AsyncIterable<string> {
      let fullOutput = '';

      try {
        for await (const chunk of rawStream) {
          if (aborted) {
            break;
          }

          if (timeToFirstToken === null) {
            timeToFirstToken = Date.now() - requestStart;
          }

          fullOutput += chunk;
          yield chunk;
        }

        if (aborted) {
          await ingestService.finalizeLog(logId, {
            status: LogStatus.CANCELLED,
            latencyMs: Date.now() - requestStart,
            timeToFirstTokenMs: timeToFirstToken ?? undefined,
            outputPreview: fullOutput.slice(0, 200),
          });
          return;
        }

        const meta = await safeMetadata;
        const latencyMs = Date.now() - requestStart;

        await ingestService.finalizeLog(logId, {
          status: LogStatus.SUCCESS,
          inputTokens: meta.inputTokens,
          outputTokens: meta.outputTokens,
          totalTokens: meta.totalTokens,
          latencyMs,
          timeToFirstTokenMs: timeToFirstToken ?? 0,
          stopReason: meta.stopReason,
          responseAt: new Date(),
          outputPreview: fullOutput.slice(0, 200),
          requestId: meta.requestId,
        });
      } catch (error) {
        logger.error(`LLM error for log ${logId}`, error);
        const err = error as { status?: number; message?: string };
        await ingestService.finalizeLog(logId, {
          status: LogStatus.ERROR,
          latencyMs: Date.now() - requestStart,
          timeToFirstTokenMs: timeToFirstToken ?? undefined,
          errorCode: err.status?.toString() ?? 'UNKNOWN',
          errorMessage: err.message ?? 'Unknown error',
          outputPreview: fullOutput.slice(0, 200),
        });
        throw error;
      }
    }

    const abort = (): void => {
      aborted = true;
      providerAbort();
    };

    return {
      stream: enrichedStream(),
      abort,
      logId,
    };
  }
}
