import { Test } from '@nestjs/testing';
import { LogStatus } from '@prisma/client';

import { PrismaService } from 'src/common/database/prisma.service';

import { IngestService } from './ingest.service';

describe('IngestService', () => {
  let service: IngestService;

  const prismaMock = {
    inferenceLog: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        IngestService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(IngestService);
  });

  describe('finalizeLog', () => {
    it('updates log and increments conversation totals on SUCCESS', async () => {
      prismaMock.inferenceLog.findUnique.mockResolvedValue({
        id: 'log-1',
        status: LogStatus.PENDING,
        conversationId: 'conv-1',
        model: 'gpt-4o',
      });
      prismaMock.inferenceLog.update.mockResolvedValue({});
      prismaMock.conversation.update.mockResolvedValue({});

      await service.finalizeLog('log-1', {
        status: LogStatus.SUCCESS,
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        latencyMs: 1200,
      });

      expect(prismaMock.inferenceLog.update).toHaveBeenCalled();
      expect(prismaMock.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conv-1' },
          data: expect.objectContaining({
            totalInputTokens: { increment: 100 },
            totalOutputTokens: { increment: 50 },
          }),
        }),
      );
    });

    it('skips duplicate finalization when already SUCCESS', async () => {
      prismaMock.inferenceLog.findUnique.mockResolvedValue({
        id: 'log-1',
        status: LogStatus.SUCCESS,
        conversationId: 'conv-1',
        model: 'gpt-4o',
      });

      await service.finalizeLog('log-1', {
        status: LogStatus.SUCCESS,
        inputTokens: 100,
        outputTokens: 50,
      });

      expect(prismaMock.inferenceLog.update).not.toHaveBeenCalled();
      expect(prismaMock.conversation.update).not.toHaveBeenCalled();
    });

    it('never throws when DB update fails', async () => {
      prismaMock.inferenceLog.findUnique.mockResolvedValue({
        id: 'log-1',
        status: LogStatus.PENDING,
        conversationId: 'conv-1',
        model: 'gpt-4o',
      });
      prismaMock.inferenceLog.update.mockRejectedValue(new Error('DB down'));

      await expect(
        service.finalizeLog('log-1', { status: LogStatus.ERROR }),
      ).resolves.toBeUndefined();
    });
  });

  describe('linkMessageToLog', () => {
    it('links message id to inference log', async () => {
      prismaMock.inferenceLog.update.mockResolvedValue({});

      await service.linkMessageToLog('log-1', 'msg-1');

      expect(prismaMock.inferenceLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: { messageId: 'msg-1' },
      });
    });

    it('never throws when DB update fails', async () => {
      prismaMock.inferenceLog.update.mockRejectedValue(new Error('DB down'));

      await expect(
        service.linkMessageToLog('log-1', 'msg-1'),
      ).resolves.toBeUndefined();
    });
  });
});
