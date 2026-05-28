"use client";

// components/layout/Sidebar.tsx
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot, LayoutDashboard, Plus, MessageSquare,
  LogOut, Trash2, Loader2, X, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  useConversationList,
  useArchiveConversation,
  useUpdateConversationStatus,
} from "@/hooks/useConversations";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface SidebarProps {
  overlay?: boolean;
  onClose?: () => void;
}

export function Sidebar({ overlay = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [hoveredConv, setHoveredConv] = useState<string | null>(null);
  const [isCancelledOpen, setIsCancelledOpen] = useState(true);

  // Real conversation list
  const { data: activeData, isLoading: isActiveLoading } = useConversationList({ status: "ACTIVE", limit: 30 });
  const { data: cancelledData, isLoading: isCancelledLoading } = useConversationList({
    status: "CANCELLED",
    limit: 30,
  });
  const conversations = activeData?.data ?? [];
  const cancelledConversations = cancelledData?.data ?? [];
  const { mutate: archiveConv, isPending: isArchiving } = useArchiveConversation();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateConversationStatus();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleNewChat = () => {
    router.push("/chat");
    onClose?.();
  };

  return (
    <>
      {overlay && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      )}
      <aside className={cn(
        "flex flex-col bg-zinc-950 border-r border-zinc-800/60 transition-all duration-300 ease-in-out z-50",
        overlay ? "fixed inset-y-0 left-0 w-full sm:w-72 shadow-2xl" : "relative w-64 shrink-0"
      )}>

        {/* ── Logo + Collapse ── */}
        <div className="flex h-14 items-center justify-between px-3 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-white truncate">LLM Logger</span>
          </div>
          {overlay && (
            <Button variant="ghost" size="icon" onClick={onClose}
              className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md shrink-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* ── New Chat ── */}
        <div className="px-2 pt-3 pb-1 shrink-0">
          <button onClick={handleNewChat}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 transition-all duration-200 shadow-md shadow-violet-600/20 active:scale-[0.98] group">
            <Plus className="h-4 w-4 shrink-0 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Chat</span>
          </button>
        </div>

        {/* ── Dashboard ── */}
        <div className="px-2 pt-1 shrink-0">
          <Link href="/dashboard" onClick={onClose}
            className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              pathname === "/dashboard" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/70 hover:text-white")}>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Dashboard</span>
            {pathname === "/dashboard" && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-500" />}
          </Link>
        </div>

        <div className="mx-3 my-2 border-t border-zinc-800/60 shrink-0" />

        {/* ── Conversation List ── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-2 space-y-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <p className="px-2 pb-1 text-[11.5px] font-semibold uppercase tracking-wider text-zinc-600">Recent</p>

          {/* Loading state */}
          {isActiveLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
            </div>
          )}

          {/* Conversation items */}
          {!isActiveLoading && conversations.map((conv) => {
            const isActive = pathname === `/chat/${conv.id}`;
            const relativeTime = formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true });

            return (
              <div key={conv.id}
                onMouseEnter={() => setHoveredConv(conv.id)}
                onMouseLeave={() => setHoveredConv(null)}
                className={cn("group relative flex items-center rounded-lg transition-all duration-150 cursor-pointer",
                  isActive ? "bg-zinc-800" : "hover:bg-zinc-800/60")}>
                <Link href={`/chat/${conv.id}`} onClick={onClose}
                  className="flex-1 flex items-center gap-2.5 px-3 py-2 min-w-0">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-300 truncate leading-snug">{conv.title}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {conv.lastMessage?.contentPreview
                        ? conv.lastMessage.contentPreview.slice(0, 40) + "…"
                        : relativeTime}
                    </p>
                  </div>
                </Link>
                {hoveredConv === conv.id && (
                  <div className="flex items-center mr-1.5 gap-1">
                    <button
                      onClick={() =>
                        updateStatus({ id: conv.id, status: "CANCELLED" })
                      }
                      disabled={isUpdatingStatus}
                      className="shrink-0 p-1 rounded-md text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors disabled:opacity-40"
                      title="Cancel conversation">
                      <X className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => archiveConv(conv.id)}
                      disabled={isArchiving}
                      className="shrink-0 p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                      title="Archive conversation">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {!isActiveLoading && conversations.length === 0 && (
            <div className="px-3 py-6 text-center">
              <MessageSquare className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600">No conversations yet</p>
              <p className="text-xs text-zinc-700 mt-0.5">Start a new chat above</p>
            </div>
          )}

          <div className="mx-2 my-2 border-t border-zinc-800/60" />

          <button
            type="button"
            onClick={() => setIsCancelledOpen((prev) => !prev)}
            className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-zinc-500 hover:bg-zinc-800/60"
          >
            <span>Cancelled</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                isCancelledOpen ? "rotate-0" : "-rotate-90"
              )}
            />
          </button>

          {isCancelledOpen && (
            <>
              {isCancelledLoading && (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
                </div>
              )}

              {!isCancelledLoading &&
                cancelledConversations.map((conv) => {
                  const isActive = pathname === `/chat/${conv.id}`;
                  const relativeTime = formatDistanceToNow(new Date(conv.updatedAt), {
                    addSuffix: true,
                  });

                  return (
                    <div
                      key={conv.id}
                      className={cn(
                        "group relative flex items-center rounded-lg transition-all duration-150 cursor-pointer",
                        isActive ? "bg-zinc-800" : "hover:bg-zinc-800/60"
                      )}
                    >
                      <Link
                        href={`/chat/${conv.id}`}
                        onClick={onClose}
                        className="flex-1 flex items-center gap-2.5 px-3 py-2 min-w-0"
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-zinc-400 truncate leading-snug">
                            {conv.title}
                          </p>
                          <p className="text-xs text-zinc-600 mt-0.5">{relativeTime}</p>
                        </div>
                      </Link>
                    </div>
                  );
                })}

              {!isCancelledLoading && cancelledConversations.length === 0 && (
                <div className="px-3 py-3 text-center">
                  <p className="text-xs text-zinc-700">No cancelled chats</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mx-3 mt-2 border-t border-zinc-800/60 shrink-0" />

        {/* ── User Info ── */}
        <div className="px-2 py-3 shrink-0">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-zinc-800/60 transition-colors group">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-[11.5px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate leading-snug">{user?.name ?? "Guest"}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email ?? ""}</p>
            </div>
            <button onClick={logout} title="Sign out"
              className="shrink-0 p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
