"use client";

import React, { useRef, useEffect } from "react";
import { Loader2, Check } from "lucide-react";
import { useLlmCatalog } from "@/hooks/useLlmCatalog";
import type { Provider } from "@/types/conversation";
import { cn } from "@/lib/utils";

interface ModelSelectorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvider: Provider;
  selectedModel: string;
  onSelect: (provider: Provider, model: string) => void;
}

export function ModelSelectorPopup({
  isOpen,
  onClose,
  selectedProvider,
  selectedModel,
  onSelect,
}: ModelSelectorPopupProps) {
  const { data: catalog, isLoading, error } = useLlmCatalog();
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="absolute bottom-full right-0 mb-2 w-64 md:w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[300px]"
    >
      <div className="px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/50">
        <span className="text-xs font-semibold text-zinc-400">Select Model</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
          </div>
        )}

        {error && (
          <div className="text-center py-4 text-xs text-red-400">
            Failed to load models
          </div>
        )}

        {catalog?.providers
          .filter((provider) => provider.id !== "GEMINI")
          .map((provider) => (
          <div key={provider.id} className="mb-3 last:mb-0">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {provider.name}
            </div>
            <div className="space-y-0.5">
              {provider.models.map((model) => {
                const isSelected =
                  selectedProvider === provider.id && selectedModel === model.id;

                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelect(provider.id, model.id);
                      onClose();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left transition-colors",
                      isSelected
                        ? "bg-violet-600/10 text-violet-400"
                        : "hover:bg-zinc-800 text-zinc-300 hover:text-white"
                    )}
                  >
                    <span className="text-xs font-medium truncate pr-2">
                      {model.name}
                    </span>
                    {isSelected && <Check className="h-3 w-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
