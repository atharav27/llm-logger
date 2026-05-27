import { LogStatus } from '@prisma/client';

export interface FinalizeLogData {
  status: LogStatus;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  timeToFirstTokenMs?: number;
  stopReason?: string;
  responseAt?: Date;
  outputPreview?: string;
  costUsd?: number;
  requestId?: string;
  errorCode?: string;
  errorMessage?: string;
}
