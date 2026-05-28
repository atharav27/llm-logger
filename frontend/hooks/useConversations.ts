// hooks/useConversations.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createConversation,
  listConversations,
  getConversation,
  archiveConversation,
  updateConversationStatus,
} from "@/lib/api/conversations.api";
import type { ListConversationsParams } from "@/lib/api/conversations.api";
import type { CreateConversationRequest } from "@/types/conversation";

// ─── Query Keys ───────────────────────────────────────────────
export const conversationKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationKeys.all, "list"] as const,
  list: (params: ListConversationsParams) => [...conversationKeys.lists(), params] as const,
  details: () => [...conversationKeys.all, "detail"] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
};

// ─── List Hook ────────────────────────────────────────────────
export function useConversationList(params: ListConversationsParams = {}) {
  return useQuery({
    queryKey: conversationKeys.list(params),
    queryFn: () => listConversations(params),
    staleTime: 15_000, // 15s — refetch if user stays idle
  });
}

// ─── Detail Hook ──────────────────────────────────────────────
export function useConversation(id: string | null) {
  return useQuery({
    queryKey: conversationKeys.detail(id ?? ""),
    queryFn: () => getConversation(id!),
    enabled: !!id,
    staleTime: 5_000,
  });
}

// ─── Create Mutation ─────────────────────────────────────────
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateConversationRequest = {}) => createConversation(body),
    onSuccess: () => {
      // Invalidate the list so sidebar refreshes with the new conversation
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
    onError: (err: any) => {
      toast.error(err?.data?.message ?? err?.message ?? "Failed to create conversation");
    },
  });
}

// ─── Archive (Delete) Mutation ───────────────────────────────
export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveConversation(id),
    onSuccess: (_data, id) => {
      // Optimistically remove from list cache
      queryClient.removeQueries({ queryKey: conversationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      toast.success("Conversation deleted");
    },
    onError: (err: any) => {
      toast.error(err?.data?.message ?? err?.message ?? "Failed to delete conversation");
    },
  });
}

// ─── Status Mutation (Cancel/Resume) ─────────────────────────
export function useUpdateConversationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "CANCELLED";
    }) => updateConversationStatus(id, status),
    onSuccess: (conversation) => {
      // Do not overwrite detail cache with PATCH payload because it may not include `messages`.
      queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversation.id) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });

      const action =
        conversation.status === "ACTIVE" ? "resumed" : "cancelled";
      toast.success(`Conversation ${action}`);
    },
    onError: (err: any) => {
      toast.error(
        err?.data?.message ?? err?.message ?? "Failed to update conversation status"
      );
    },
  });
}
