import { Injectable, Logger } from '@nestjs/common';
import { LogStatus } from '@prisma/client';

import { PrismaService } from 'src/common/database/prisma.service';

import { FinalizeLogData } from './finalize-log.types';
import { calculateCost } from './pricing.config';

const FINALIZED_STATUSES: LogStatus[] = [
  LogStatus.SUCCESS,
  LogStatus.ERROR,
  LogStatus.CANCELLED,
];

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(private readonly prisma: PrismaService) {}

  async finalizeLog(logId: string, data: FinalizeLogData): Promise<void> {
    try {
      const existingLog = await this.prisma.inferenceLog.findUnique({
        where: { id: logId },
        select: { id: true, status: true, conversationId: true, model: true },
      });

      if (!existingLog) {
        this.logger.warn(`finalizeLog: log ${logId} not found — skipping`);
        return;
      }

      if (FINALIZED_STATUSES.includes(existingLog.status)) {
        this.logger.warn(
          `finalizeLog: log ${logId} already finalized with status ${existingLog.status} — skipping duplicate`,
        );
        return;
      }

      if (data.status === LogStatus.ERROR && !data.errorMessage) {
        this.logger.warn(
          `finalizeLog: log ${logId} ERROR without errorMessage`,
        );
      }

      if (
        data.status === LogStatus.SUCCESS &&
        (data.inputTokens == null || data.outputTokens == null)
      ) {
        this.logger.warn(
          `finalizeLog: log ${logId} SUCCESS without token counts`,
        );
      }

      const costUsd =
        data.costUsd ??
        calculateCost(existingLog.model, data.inputTokens, data.outputTokens);

      await this.prisma.inferenceLog.update({
        where: { id: logId },
        data: {
          status: data.status,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          totalTokens: data.totalTokens,
          latencyMs: data.latencyMs,
          timeToFirstTokenMs: data.timeToFirstTokenMs,
          stopReason: data.stopReason,
          responseAt: data.responseAt ?? new Date(),
          outputPreview: data.outputPreview,
          costUsd,
          requestId: data.requestId,
          errorCode: data.errorCode ?? null,
          errorMessage: data.errorMessage ?? null,
        },
      });

      if (data.status === LogStatus.SUCCESS) {
        await this.incrementConversationTotals(
          existingLog.conversationId,
          data.inputTokens ?? 0,
          data.outputTokens ?? 0,
          costUsd,
        );
      }

      this.logger.debug(`finalizeLog: log ${logId} → ${data.status}`);
    } catch (err) {
      this.logger.error(`finalizeLog: failed to finalize log ${logId}`, err);
    }
  }

  async linkMessageToLog(logId: string, messageId: string): Promise<void> {
    try {
      await this.prisma.inferenceLog.update({
        where: { id: logId },
        data: { messageId },
      });
      this.logger.debug(
        `linkMessageToLog: log ${logId} → message ${messageId}`,
      );
    } catch (err) {
      this.logger.error(
        `linkMessageToLog: failed to link message ${messageId} to log ${logId}`,
        err,
      );
    }
  }

  private async incrementConversationTotals(
    conversationId: string,
    inputTokens: number,
    outputTokens: number,
    costUsd: number,
  ): Promise<void> {
    try {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          totalInputTokens: { increment: inputTokens },
          totalOutputTokens: { increment: outputTokens },
          totalCostUsd: { increment: costUsd },
          updatedAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error(
        `incrementConversationTotals: failed for conversation ${conversationId}`,
        err,
      );
    }
  }
}
