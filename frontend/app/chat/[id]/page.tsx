"use client";

// app/chat/[id]/page.tsx — Active conversation thread
import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { ChatShell } from "@/components/layout/ChatShell";
import { PromptBar } from "@/components/chat/PromptBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import {
  useConversation,
  useUpdateConversationStatus,
} from "@/hooks/useConversations";
import { streamMessage } from "@/lib/api/sse";
import { useQueryClient } from "@tanstack/react-query";
import { conversationKeys } from "@/hooks/useConversations";
import type { ConversationMessage, Provider } from "@/types/conversation";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: conversation, isLoading: isLoadingConv, error } = useConversation(id);
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useUpdateConversationStatus();

  // Local streaming state — overlaid on top of the fetched messages
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, streamingContent]);

  useEffect(() => () => { abortRef.current?.(); }, []);

  const handleSend = (content: string, provider: Provider, model: string) => {
    if (isStreaming || !id) return;

    // Check if conversation is still ACTIVE
    if (conversation?.status && conversation.status !== "ACTIVE") {
      toast.error(`This conversation is ${conversation.status.toLowerCase()} and cannot receive new messages.`);
      return;
    }

    setPendingUserMessage(content);
    setStreamingContent("");
    setIsStreaming(true);

    let fullContent = "";

    const abort = streamMessage(
      id,
      { content, provider, model },
      {
        onChunk: (chunk) => {
          fullContent += chunk;
          setStreamingContent(fullContent);
        },
        onMetadata: () => {
          // inference log metadata — could update token counts
        },
        onDone: () => {
          // Optimistically update the cache to prevent flicker while refetching
          queryClient.setQueryData(conversationKeys.detail(id), (oldData: any) => {
            if (!oldData) return oldData;
            const safeMessages = Array.isArray(oldData.messages) ? oldData.messages : [];
            return {
              ...oldData,
              messages: [
                ...safeMessages,
                {
                  id: `temp-user-${Date.now()}`,
                  conversationId: id,
                  role: "user",
                  content: content,
                  contentPreview: content.slice(0, 200),
                  tokenCount: null,
                  sequenceNumber: safeMessages.length + 1,
                  createdAt: new Date().toISOString(),
                  inferenceLog: null,
                },
                {
                  id: `temp-ast-${Date.now()}`,
                  conversationId: id,
                  role: "assistant",
                  content: fullContent,
                  contentPreview: fullContent.slice(0, 200),
                  tokenCount: null,
                  sequenceNumber: safeMessages.length + 2,
                  createdAt: new Date().toISOString(),
                  inferenceLog: null,
                },
              ],
            };
          });

          setIsStreaming(false);
          setPendingUserMessage(null);
          setStreamingContent("");
          abortRef.current = null;

          // Refetch the conversation to get the saved messages with real IDs and metadata
          queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) });
          // Also refresh the sidebar list (updatedAt changed)
          queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
        },
        onError: (msg) => {
          setIsStreaming(false);
          setPendingUserMessage(null);
          setStreamingContent("");
          abortRef.current = null;
          toast.error(msg || "Failed to get response");
        },
      }
    );

    abortRef.current = abort;
  };

  // ── Loading state ──
  if (isLoadingConv) {
    return (
      <ChatShell>
        <div className="flex flex-1 items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        </div>
      </ChatShell>
    );
  }

  // ── Error state ──
  if (error || !conversation) {
    return (
      <ChatShell>
        <div className="flex flex-1 flex-col items-center justify-center h-full gap-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-zinc-400">Conversation not found</p>
          <button onClick={() => router.push("/chat")}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Start a new chat →
          </button>
        </div>
      </ChatShell>
    );
  }

  const isCancelled = conversation.status === "CANCELLED";
  const isArchived = conversation.status === "ARCHIVED";
  const isReadOnly = isCancelled || isArchived;
  const messages = Array.isArray(conversation.messages)
    ? conversation.messages
    : [];

  const handleCancelConversation = async () => {
    if (isStreaming || isUpdatingStatus) return;
    await updateStatus({ id, status: "CANCELLED" });
  };

  const handleResumeConversation = async () => {
    if (isStreaming || isUpdatingStatus) return;
    await updateStatus({ id, status: "ACTIVE" });
  };

  return (
    <ChatShell>
      <div className="flex flex-col h-full">
        <div className="shrink-0 flex items-center justify-end px-4 pt-3">
          {conversation.status === "ACTIVE" && (
            <button
              onClick={handleCancelConversation}
              disabled={isStreaming || isUpdatingStatus}
              className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdatingStatus ? "Updating..." : "Cancel Conversation"}
            </button>
          )}

          {conversation.status === "CANCELLED" && (
            <button
              onClick={handleResumeConversation}
              disabled={isStreaming || isUpdatingStatus}
              className="rounded-md border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-300 transition-colors hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdatingStatus ? "Updating..." : "Resume Conversation"}
            </button>
          )}
        </div>

        {/* Status banner for non-active conversations */}
        {isReadOnly && (
          <div className={`shrink-0 px-4 py-2 text-xs text-center ${
            isArchived ? "bg-zinc-800/50 text-zinc-400" : "bg-amber-900/20 text-amber-400"
          }`}>
            {isArchived ? "This conversation has been archived." : "This conversation was cancelled."}
          </div>
        )}

        {/* Scrollable message list */}
        <div className="scrollbar-none flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
          <div className="max-w-3xl mx-auto w-full px-2 py-6 space-y-1">

            {/* Saved messages from DB */}
            {messages
              .filter((msg) => msg.role !== "system")
              .map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={{
                    id: msg.id,
                    role: msg.role as "user" | "assistant",
                    content: msg.content,
                    timestamp: new Date(msg.createdAt),
                  }}
                />
              ))}

            {/* Optimistic user message (not yet saved) */}
            {pendingUserMessage && (
              <MessageBubble
                message={{
                  id: "pending-user",
                  role: "user",
                  content: pendingUserMessage,
                  timestamp: new Date(),
                }}
              />
            )}

            {/* Streaming assistant response */}
            {isStreaming && streamingContent && (
              <MessageBubble
                message={{ id: "streaming", role: "assistant", content: streamingContent }}
                isStreaming={true}
              />
            )}

            {/* Thinking dots before first chunk */}
            {isStreaming && !streamingContent && (
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 mt-0.5">
                  <div className="flex gap-1 items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Prompt bar — disabled for archived/cancelled conversations */}
        <div className="shrink-0 max-w-3xl mx-auto w-full">
          {isReadOnly ? (
            <div className="px-4 pb-5 pt-3 text-center">
              <p className="text-xs text-zinc-600">
                This conversation is {conversation.status.toLowerCase()} and cannot receive new messages.{" "}
                <button onClick={() => router.push("/chat")} className="text-violet-400 hover:text-violet-300">
                  Start a new chat →
                </button>
              </p>
            </div>
          ) : (
            <PromptBar
              onSend={handleSend}
              isLoading={isStreaming}
              placeholder="Send a message..."
              disabled={isStreaming}
            />
          )}
        </div>
      </div>
    </ChatShell>
  );
}
