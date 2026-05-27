"use client";

// components/layout/ChatShell.tsx
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useUIStore } from "@/lib/stores/useUIStore";
import { cn } from "@/lib/utils";

interface ChatShellProps {
  children: React.ReactNode;
}

export function ChatShell({ children }: ChatShellProps) {
  const { sidebarOpen } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      {mobileOpen && (
        <Sidebar overlay onClose={() => setMobileOpen(false)} />
      )}

      {/* ── Main content area ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile top bar with hamburger */}
        <div className="flex md:hidden h-12 items-center gap-3 px-4 border-b border-zinc-800/60 bg-zinc-950 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-white">LLM Logger</span>
        </div>

        {/* Page content fills remaining height */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
