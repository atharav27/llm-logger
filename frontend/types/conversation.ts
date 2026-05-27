// types/conversation.ts

export type ConversationStatus = "ACTIVE" | "CANCELLED" | "ARCHIVED";
export type Provider = "GEMINI" | "GROQ";
export type MessageRole = "user" | "assistant" | "system";

/** Returned in list view — no full messages, only last message preview */
export interface ConversationSummary {
  id: string;
  title: string;
  status: ConversationStatus;
  model: string;
  provider: Provider;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: string; // Decimal serialized as string e.g. "0.004200"
  messageCount: number;
  lastMessage: {
    role: MessageRole;
    contentPreview: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

/** Inference log attached to each assistant message */
export interface InferenceLog {
  id: string;
  latencyMs: number | null;
  timeToFirstTokenMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  costUsd: string | null; // Decimal as string
  model: string;
  provider: Provider;
  status: "SUCCESS" | "ERROR" | "CANCELLED" | "PENDING";
  stopReason: string | null;
  requestAt: string;
  responseAt: string | null;
  isStreaming: boolean;
}

/** A single message in a conversation */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;       // full text
  contentPreview: string; // first 200 chars
  tokenCount: number | null;
  sequenceNumber: number;
  createdAt: string;
  inferenceLog: InferenceLog | null; // only on assistant messages
}

/** Full conversation detail with all messages */
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  status: ConversationStatus;
  model: string;
  provider: Provider;
  systemPrompt: string | null;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  messages: ConversationMessage[];
}

/** Paginated list response wrapper */
export interface PaginatedConversations {
  data: ConversationSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Body for POST /conversations */
export interface CreateConversationRequest {
  title?: string;
  provider?: Provider;
  model?: string;
  systemPrompt?: string;
}

/** Body for POST /conversations/:id/message */
export interface SendMessageRequest {
  content: string;
  provider?: Provider;
  model?: string;
}

/** SSE event payloads from POST /conversations/:id/message */
export type SseEvent =
  | { type: "chunk"; content: string }
  | { type: "metadata"; log: InferenceLog }
  | { type: "done" }
  | { type: "error"; message: string };
