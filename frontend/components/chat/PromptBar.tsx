"use client";

// components/chat/PromptBar.tsx
import React, { useRef, useEffect, useState } from "react";
import { ArrowUp, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Provider } from "@/types/conversation";
import { ModelSelectorPopup } from "./ModelSelectorPopup";
import { useLlmCatalog } from "@/hooks/useLlmCatalog";
import { DEFAULT_MODEL } from "@/config/constants";

interface PromptBarProps {
  onSend: (message: string, provider: Provider, model: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function PromptBar({
  onSend,
  isLoading = false,
  placeholder = "Message LLM Logger...",
  disabled = false,
}: PromptBarProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [provider, setProvider] = useState<Provider>("GROQ");
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const { data: catalog } = useLlmCatalog();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Find the friendly name for the selected model
  const selectedModelName = React.useMemo(() => {
    if (!catalog) return model;
    const p = catalog.providers.find((p) => p.id === provider);
    const m = p?.models.find((m) => m.id === model);
    return m?.name || model;
  }, [catalog, provider, model]);

  // Auto-resize textarea as content grows (max ~6 lines ≈ 144px)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed, provider, model);
    setValue("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="px-4 pb-5 pt-3 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent">
      <div
        className={cn(
          "relative flex flex-col gap-2 rounded-2xl border bg-zinc-900 px-4 py-3 transition-all duration-200 shadow-lg",
          isFocused
            ? "border-violet-500/50 shadow-violet-500/10 shadow-xl ring-1 ring-violet-500/20"
            : "border-zinc-700/60 hover:border-zinc-600"
        )}
      >
        <div className="flex items-end gap-2">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:opacity-50 leading-relaxed max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700"
            style={{ height: "auto" }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "shrink-0 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 mb-1",
              canSend
                ? "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 active:scale-90"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Bottom Action Row */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {/* Left side actions (e.g. attach) could go here */}
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              {selectedModelName}
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>

            <ModelSelectorPopup
              isOpen={isModelSelectorOpen}
              onClose={() => setIsModelSelectorOpen(false)}
              selectedProvider={provider}
              selectedModel={model}
              onSelect={(newProvider, newModel) => {
                setProvider(newProvider);
                setModel(newModel);
              }}
            />
          </div>
        </div>
      </div>

      {/* Hint text */}
      <p className="text-center text-[10px] text-zinc-600 mt-2">
        Press{" "}
        <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 font-mono text-[9px] text-zinc-500">
          Enter
        </kbd>{" "}
        to send ·{" "}
        <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 font-mono text-[9px] text-zinc-500">
          Shift + Enter
        </kbd>{" "}
        for new line
      </p>
    </div>
  );
}
