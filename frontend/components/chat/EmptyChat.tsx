"use client";

// components/chat/EmptyChat.tsx
import React from "react";
import { Bot, Zap, Code2, BrainCircuit, Layers } from "lucide-react";

const suggestions = [
  {
    icon: BrainCircuit,
    label: "Explain a concept",
    prompt: "Explain how RAG (Retrieval-Augmented Generation) works in simple terms",
    color: "text-violet-400",
    bg: "bg-violet-600/10 border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-600/15",
  },
  {
    icon: Code2,
    label: "Debug my code",
    prompt: "Help me debug my LangChain pipeline that's returning empty responses",
    color: "text-blue-400",
    bg: "bg-blue-600/10 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-600/15",
  },
  {
    icon: Zap,
    label: "Optimize performance",
    prompt: "What are the best strategies to reduce LLM API latency in production?",
    color: "text-amber-400",
    bg: "bg-amber-600/10 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-600/15",
  },
  {
    icon: Layers,
    label: "Compare models",
    prompt: "Compare GPT-4o vs Claude 3.5 Sonnet for complex reasoning tasks",
    color: "text-emerald-400",
    bg: "bg-emerald-600/10 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-600/15",
  },
];

interface EmptyChatProps {
  onSuggestion: (prompt: string) => void;
  userName?: string;
}

export function EmptyChat({ onSuggestion, userName }: EmptyChatProps) {
  const greeting = userName ? `Hello, ${userName.split(" ")[0]}` : "Hello there";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      {/* Logo + greeting */}
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="relative mb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/25">
            <Bot className="h-8 w-8 text-white" />
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 blur-xl opacity-30 -z-10" />
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          {greeting} 👋
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-sm leading-relaxed">
          Start a conversation with your AI. Ask anything, debug your pipeline,
          or explore your LLM logs.
        </p>
      </div>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {suggestions.map(({ icon: Icon, label, prompt, color, bg }) => (
          <button
            key={label}
            onClick={() => onSuggestion(prompt)}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 active:scale-[0.98] ${bg}`}
          >
            <div className={`mt-0.5 shrink-0 ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200 mb-0.5">{label}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">
                {prompt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
