"use client";

// app/chat/page.tsx — New / blank conversation
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChatShell } from "@/components/layout/ChatShell";
import { PromptBar } from "@/components/chat/PromptBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { EmptyChat } from "@/components/chat/EmptyChat";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useCreateConversation } from "@/hooks/useConversations";
import { streamMessage } from "@/lib/api/sse";
import type { ConversationMessage, Provider } from "@/types/conversation";

export default function ChatPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const { mutateAsync: createConversation, isPending: isCreating } = useCreateConversation();

  const isLoading = isCreating || isStreaming;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Cleanup stream on unmount
  useEffect(() => () => { abortRef.current?.(); }, []);

  const handleSend = async (content: string, provider?: Provider, model?: string) => {
    if (isLoading) return;

    // 1. Add user message to local state immediately
    const userMsg: ConversationMessage = {
      id: crypto.randomUUID(),
      conversationId: "",
      role: "user",
      content,
      contentPreview: content.slice(0, 200),
      tokenCount: null,
      sequenceNumber: 1,
      createdAt: new Date().toISOString(),
      inferenceLog: null,
    };
    setMessages([userMsg]);
    setStreamingContent("");
    setIsStreaming(false);

    try {
      // 2. Create conversation
      const conversation = await createConversation({
        title: content.slice(0, 80), // use first 80 chars as title
      });

      // 3. Navigate to the conversation route (but stay to show streaming)
      // We stream first, then navigate so user sees the response
      setIsStreaming(true);

      let fullContent = "";
      const abort = streamMessage(
        conversation.id,
        { content, provider, model },
        {
          onChunk: (chunk) => {
            fullContent += chunk;
            setStreamingContent(fullContent);
          },
          onMetadata: () => {
            // Metadata received — optionally store inference info
          },
          onDone: () => {
            setIsStreaming(false);
            abortRef.current = null;
            // Navigate to the conversation page with full history
            router.push(`/chat/${conversation.id}`);
          },
          onError: (msg) => {
            setIsStreaming(false);
            abortRef.current = null;
            toast.error(msg || "Failed to get response");
          },
        }
      );

      abortRef.current = abort;
    } catch (err: any) {
      setIsStreaming(false);
      toast.error(err?.data?.message ?? err?.message ?? "Failed to start conversation");
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <ChatShell>
      <div className="flex flex-col h-full">
        {/* Message area */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {!hasMessages ? (
            <EmptyChat onSuggestion={handleSend} userName={user?.name} />
          ) : (
            <div className="max-w-3xl mx-auto w-full px-2 py-6 space-y-1">
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

              {/* Streaming assistant response */}
              {isStreaming && (
                <MessageBubble
                  message={{ id: "streaming", role: "assistant", content: streamingContent || "" }}
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
          )}
        </div>

        {/* Prompt bar */}
        <div className="shrink-0 max-w-3xl mx-auto w-full">
          <PromptBar
            onSend={handleSend}
            isLoading={isLoading}
            placeholder={hasMessages ? "Waiting for response..." : "Message LLM Logger..."}
            disabled={isLoading}
          />
        </div>
      </div>
    </ChatShell>
  );
}
