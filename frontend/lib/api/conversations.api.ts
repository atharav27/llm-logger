// lib/api/conversations.api.ts
import { apiFetch } from "./client";
import { API_ROUTES } from "@/config/routes";
import type {
  Conversation,
  ConversationSummary,
  CreateConversationRequest,
  PaginatedConversations,
} from "@/types/conversation";

export interface ListConversationsParams {
  page?: number;
  limit?: number;
  status?: "ACTIVE" | "CANCELLED" | "ARCHIVED";
}

/** POST /api/v1/conversations — create a new conversation */
export function createConversation(
  body: CreateConversationRequest = {}
): Promise<Conversation> {
  return apiFetch<Conversation>(API_ROUTES.CONVERSATIONS.CREATE, {
    method: "POST",
    body,
  });
}

/** GET /api/v1/conversations — paginated list */
export function listConversations(
  params: ListConversationsParams = {}
): Promise<PaginatedConversations> {
  return apiFetch<PaginatedConversations>(API_ROUTES.CONVERSATIONS.LIST, {
    method: "GET",
    params,
  });
}

/** GET /api/v1/conversations/:id — full conversation with messages */
export function getConversation(id: string): Promise<Conversation> {
  return apiFetch<Conversation>(API_ROUTES.CONVERSATIONS.DETAIL(id), {
    method: "GET",
  });
}

/** DELETE /api/v1/conversations/:id — archive (204 No Content) */
export async function archiveConversation(id: string): Promise<void> {
  await apiFetch<void>(API_ROUTES.CONVERSATIONS.DELETE(id), {
    method: "DELETE",
  });
}
