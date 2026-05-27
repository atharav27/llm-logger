import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { LogStatus, Provider } from '@prisma/client';

import { PrismaService } from 'src/common/database/prisma.service';
import { IngestService } from 'src/modules/ingest/ingest.service';

import { LlmService } from './llm.service';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';

describe('LlmService', () => {
  let service: LlmService;

  const prismaMock = {
    inferenceLog: {
      create: jest.fn(),
    },
  };

  const ingestMock = {
    finalizeLog: jest.fn().mockResolvedValue(undefined),
  };

  const mockProvider = {
    sendMessage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: IngestService, useValue: ingestMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'llm.geminiApiKey') return 'gemini-key';
              if (key === 'llm.groqApiKey') return 'groq-key';
              if (key === 'llm.openRouterApiKey') return 'openrouter-key';
              return undefined;
            }),
          },
        },
        { provide: GeminiProvider, useValue: mockProvider },
        { provide: GroqProvider, useValue: mockProvider },
        { provide: OpenRouterProvider, useValue: mockProvider },
      ],
    }).compile();

    service = moduleRef.get(LlmService);
    service.onModuleInit();
  });

  it('creates PENDING inference log with provider and model', async () => {
    prismaMock.inferenceLog.create.mockResolvedValue({ id: 'log-1' });
    mockProvider.sendMessage.mockResolvedValue({
      stream: (async function* () {
        yield 'Hi';
      })(),
      metadata: Promise.resolve({
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
        stopReason: 'stop',
      }),
      abort: jest.fn(),
    });

    await service.sendMessage({
      conversationId: 'conv-1',
      params: {
        provider: Provider.GEMINI,
        model: 'gemini-2.0-flash',
        messages: [{ role: 'user', content: 'Hello' }],
      },
    });

    expect(prismaMock.inferenceLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: Provider.GEMINI,
          model: 'gemini-2.0-flash',
          status: LogStatus.PENDING,
        }),
      }),
    );
  });

  it('delegates finalizeLog to IngestService on SUCCESS', async () => {
    prismaMock.inferenceLog.create.mockResolvedValue({ id: 'log-1' });
    mockProvider.sendMessage.mockResolvedValue({
      stream: (async function* () {
        yield 'Answer';
      })(),
      metadata: Promise.resolve({
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
        stopReason: 'end_turn',
        requestId: 'req-1',
      }),
      abort: jest.fn(),
    });

    const result = await service.sendMessage({
      conversationId: 'conv-1',
      params: {
        provider: Provider.GROQ,
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Hello' }],
      },
    });

    for await (const _chunk of result.stream) {
      // consume stream
    }

    expect(ingestMock.finalizeLog).toHaveBeenCalledWith(
      'log-1',
      expect.objectContaining({
        status: LogStatus.SUCCESS,
        inputTokens: 10,
        outputTokens: 5,
      }),
    );
  });

  it('delegates finalizeLog to IngestService on CANCELLED when aborted', async () => {
    prismaMock.inferenceLog.create.mockResolvedValue({ id: 'log-1' });

    mockProvider.sendMessage.mockResolvedValue({
      stream: (async function* () {
        yield 'partial';
        yield 'more';
      })(),
      metadata: new Promise(() => {}),
      abort: jest.fn(),
    });

    const result = await service.sendMessage({
      conversationId: 'conv-1',
      params: {
        provider: Provider.GEMINI,
        model: 'gemini-2.0-flash',
        messages: [{ role: 'user', content: 'Hello' }],
      },
    });

    const iter = result.stream[Symbol.asyncIterator]();
    await iter.next();
    result.abort();
    await iter.next();

    expect(ingestMock.finalizeLog).toHaveBeenCalledWith(
      'log-1',
      expect.objectContaining({ status: LogStatus.CANCELLED }),
    );
  });

  it('throws when provider is not configured', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: IngestService, useValue: ingestMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => undefined),
          },
        },
        { provide: GeminiProvider, useValue: mockProvider },
        { provide: GroqProvider, useValue: mockProvider },
        { provide: OpenRouterProvider, useValue: mockProvider },
      ],
    }).compile();

    const svc = moduleRef.get(LlmService);
    svc.onModuleInit();

    await expect(
      svc.sendMessage({
        conversationId: 'conv-1',
        params: {
          provider: Provider.GEMINI,
          model: 'gemini-2.0-flash',
          messages: [{ role: 'user', content: 'Hi' }],
        },
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
