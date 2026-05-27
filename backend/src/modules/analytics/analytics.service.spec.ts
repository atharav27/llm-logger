import { Test } from '@nestjs/testing';

import { PrismaService } from 'src/common/database/prisma.service';

import { AnalyticsService } from './analytics.service';
import { AnalyticsPeriod } from './dtos/analytics-period.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let svc: any;

  const userId = '11111111-1111-1111-1111-111111111111';

  const prismaMock = {
    conversation: { count: jest.fn() },
    message: { count: jest.fn() },
    inferenceLog: {
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(AnalyticsService);
    svc = service;
  });

  describe('getOverview', () => {
    beforeEach(() => {
      prismaMock.conversation.count.mockResolvedValue(2);
      prismaMock.message.count.mockResolvedValue(10);

      // getOverview calls inferenceLog.count twice, and aggregate three times
      prismaMock.inferenceLog.count
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(7);
      prismaMock.inferenceLog.aggregate
        .mockResolvedValueOnce({ _avg: { latencyMs: 250.4 } }) // latency
        .mockResolvedValueOnce({ _sum: { totalTokens: 150 } }) // tokens
        .mockResolvedValueOnce({ _sum: { costUsd: 0.05 } }); // cost
    });

    it('scopes all queries to the current user', async () => {
      await service.getOverview(userId, AnalyticsPeriod.LAST_7_DAYS);

      expect(prismaMock.conversation.count).toHaveBeenCalled();
      expect(prismaMock.message.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            conversation: { userId },
          }),
        }),
      );
      expect(prismaMock.inferenceLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            conversation: { userId },
          }),
        }),
      );
      expect(prismaMock.inferenceLog.aggregate).toHaveBeenCalled();
    });

    it('returns mapped overview fields (cards only)', async () => {
      const result = await service.getOverview(
        userId,
        AnalyticsPeriod.LAST_7_DAYS,
      );

      expect(result).toMatchObject({
        period: AnalyticsPeriod.LAST_7_DAYS,
        totalConversations: 2,
        totalMessages: 10,
        totalRequests: 8,
        totalTokensUsed: 150,
        totalCostUsd: '0.05',
        avgLatencyMs: 250,
        successRate: 87.5,
      });
      expect(result).not.toHaveProperty('last30Days');
    });
  });

  describe('fillDailyGaps', () => {
    it('inserts zero-count days for missing buckets', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const rows = [{ bucket: today, count: BigInt(5), tokens: BigInt(100) }];
      const filled = svc.fillDailyGaps(rows, 3);

      expect(filled).toHaveLength(3);
      expect(filled[2]).toEqual({
        date: today.toISOString().slice(0, 10),
        requests: 5,
        tokens: 100,
      });
      expect(
        filled.filter((r: { requests: number }) => r.requests === 0),
      ).toHaveLength(2);
    });
  });
});
