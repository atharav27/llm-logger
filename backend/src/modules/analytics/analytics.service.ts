import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/common/database/prisma.service';

import { AnalyticsPeriod } from './dtos/analytics-period.dto';

interface TimeSeriesRow {
  bucket: Date;
  count: bigint;
  tokens?: bigint | null;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string, period?: AnalyticsPeriod) {
    const { from, to } = this.getRange(period);

    const [
      messageCount,
      totalRequests,
      successCount,
      latencyStats,
      tokenStats,
      costStats,
      conversationsCreated,
    ] = await Promise.all([
      this.prisma.message.count({
        where: {
          conversation: { userId },
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.inferenceLog.count({
        where: {
          conversation: { userId },
          requestAt: { gte: from, lte: to },
        },
      }),
      this.prisma.inferenceLog.count({
        where: {
          conversation: { userId },
          status: 'SUCCESS',
          requestAt: { gte: from, lte: to },
        },
      }),
      this.prisma.inferenceLog.aggregate({
        where: {
          conversation: { userId },
          status: 'SUCCESS',
          latencyMs: { not: null },
          requestAt: { gte: from, lte: to },
        },
        _avg: { latencyMs: true },
      }),
      this.prisma.inferenceLog.aggregate({
        where: {
          conversation: { userId },
          requestAt: { gte: from, lte: to },
        },
        _sum: { totalTokens: true },
      }),
      this.prisma.inferenceLog.aggregate({
        where: {
          conversation: { userId },
          requestAt: { gte: from, lte: to },
        },
        _sum: { costUsd: true },
      }),
      this.prisma.conversation.count({
        where: {
          userId,
          createdAt: { gte: from, lte: to },
        },
      }),
    ]);

    const successRate =
      totalRequests > 0
        ? Math.round((successCount / totalRequests) * 100 * 100) / 100
        : 0;

    return {
      period: (period ?? AnalyticsPeriod.LAST_30_DAYS) as AnalyticsPeriod,
      from: from.toISOString(),
      to: to.toISOString(),
      totalConversations: conversationsCreated,
      totalMessages: messageCount,
      totalRequests,
      totalTokensUsed: tokenStats._sum.totalTokens ?? 0,
      totalCostUsd: (costStats._sum.costUsd ?? 0).toString(),
      avgLatencyMs: Math.round(latencyStats._avg.latencyMs ?? 0),
      successRate,
    };
  }

  async getTimeseries(userId: string, period?: AnalyticsPeriod) {
    const resolvedPeriod = period ?? AnalyticsPeriod.LAST_30_DAYS;
    const { from, to, days } = this.getRange(resolvedPeriod);

    const rows = await this.prisma.$queryRaw<TimeSeriesRow[]>`
      SELECT
        DATE_TRUNC('day', il.request_at) AS bucket,
        COUNT(*)                          AS count,
        SUM(il.total_tokens)              AS tokens
      FROM inference_logs il
      JOIN conversations c ON il.conversation_id = c.id
      WHERE c.user_id = ${userId}
        AND il.request_at >= ${from}
        AND il.request_at <= ${to}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    return {
      period: resolvedPeriod,
      granularity: 'day' as const,
      points: this.fillDailyGaps(rows, days).map((row) => ({
        date: row.date,
        requests: row.requests,
        tokens: row.tokens,
      })),
    };
  }

  private fillDailyGaps(
    rows: TimeSeriesRow[],
    days: number,
  ): { date: string; requests: number; tokens: number }[] {
    const map = new Map<string, TimeSeriesRow>();
    for (const row of rows) {
      const key = this.toDateKey(new Date(row.bucket));
      map.set(key, row);
    }

    const result: { date: string; requests: number; tokens: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = this.toDateKey(d);
      const row = map.get(key);

      result.push({
        date: key,
        requests: row ? Number(row.count) : 0,
        tokens: row?.tokens != null ? Number(row.tokens) : 0,
      });
    }

    return result;
  }

  private toDateKey(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private getRange(period: AnalyticsPeriod = AnalyticsPeriod.LAST_30_DAYS): {
    from: Date;
    to: Date;
    days: number;
  } {
    const now = new Date();
    const to = now;

    const days =
      period === AnalyticsPeriod.TODAY
        ? 1
        : period === AnalyticsPeriod.LAST_7_DAYS
          ? 7
          : period === AnalyticsPeriod.LAST_90_DAYS
            ? 90
            : 30;

    const from = new Date(now);
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);

    return { from, to, days };
  }
}
