"use client";

// components/chat/MessageBubble.tsx
import React from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "./MarkdownMessage";

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-3 rounded-xl transition-colors",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5",
          isUser
            ? "bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20"
            : "bg-zinc-800 border border-zinc-700"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-white" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-violet-400" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[88%] flex flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-base leading-relaxed",
            isUser
              ? "bg-gradient-to-br from-violet-600/90 to-indigo-600/90 text-zinc-50 rounded-tr-sm shadow-md shadow-violet-600/10"
              : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 rounded-tl-sm"
          )}
        >
          {isUser ? (
            <p className="text-base leading-relaxed">{message.content}</p>
          ) : (
            <MarkdownMessage content={message.content} />
          )}
          {/* Streaming cursor */}
          {isStreaming && !isUser && (
            <span className="inline-block ml-0.5 h-4 w-0.5 bg-violet-400 animate-pulse rounded-full align-middle" />
          )}
        </div>
        {/* Timestamp */}
        {message.timestamp && (
          <span className="text-xs text-zinc-600 px-1">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
