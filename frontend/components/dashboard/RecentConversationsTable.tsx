"use client";

import React from "react";
import { format } from "date-fns";
import { Loader2, MessageSquare, Database, Coins, Activity, Link as LinkIcon } from "lucide-react";
import { useConversationList } from "@/hooks/useConversations";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function RecentConversationsTable() {
  const { data: pageData, isLoading } = useConversationList({ limit: 10 });
  const conversations = pageData?.data ?? [];

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-zinc-800/50 bg-zinc-900/40">
        <Activity className="h-4 w-4 text-violet-400" />
        <h3 className="font-semibold text-white">Recent Conversations Logs</h3>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 bg-zinc-900/40 border-b border-zinc-800/50">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Messages</th>
              <th className="px-4 py-3 font-medium">Tokens</th>
              <th className="px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-violet-500" />
                  <p>Loading conversation logs...</p>
                </td>
              </tr>
            ) : conversations.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  No conversations found. Start chatting to generate logs!
                </td>
              </tr>
            ) : (
              conversations.map((chat) => (
                <tr key={chat.id} className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate" title={chat.title}>
                    {chat.title || "New Conversation"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs bg-zinc-800/50 border-zinc-700 font-normal text-zinc-300">
                      {chat.provider}: {chat.model}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{chat.messageCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-blue-400" />
                      <span>{((chat.totalInputTokens || 0) + (chat.totalOutputTokens || 0)).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-emerald-400" />
                      <span>
                        {parseFloat(chat.totalCostUsd || "0") === 0 
                          ? "$0.00" 
                          : parseFloat(chat.totalCostUsd || "0") < 0.01 
                            ? `$${parseFloat(chat.totalCostUsd).toFixed(4)}`
                            : `$${parseFloat(chat.totalCostUsd).toFixed(2)}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] uppercase",
                        chat.status === "ACTIVE" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      )}
                    >
                      {chat.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {format(new Date(chat.createdAt), "MMM d, HH:mm")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/chat/${chat.id}`} className="inline-flex items-center justify-center p-1.5 text-zinc-500 hover:text-violet-400 hover:bg-violet-400/10 rounded-md transition-colors">
                      <LinkIcon className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Collapsible View */}
      <div className="md:hidden flex flex-col divide-y divide-zinc-800/50">
        {isLoading ? (
          <div className="p-8 text-center text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-violet-500" />
            <p className="text-sm">Loading logs...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            No conversations found. Start chatting!
          </div>
        ) : (
          conversations.map((chat) => (
            <details key={chat.id} className="group overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/20 list-none [&::-webkit-details-marker]:hidden">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9px] uppercase px-1.5 py-0",
                        chat.status === "ACTIVE" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      )}
                    >
                      {chat.status}
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      {format(new Date(chat.createdAt), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm text-white truncate">
                    {chat.title || "New Conversation"}
                  </h4>
                </div>
                {/* Custom chevron that rotates on open */}
                <div className="flex-shrink-0 text-zinc-500 group-open:rotate-180 transition-transform">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </summary>
              
              <div className="p-4 pt-0 bg-zinc-900/20 text-sm">
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-zinc-800/50 pt-3">
                  <div>
                    <span className="text-xs text-zinc-500 block mb-0.5">Model</span>
                    <span className="text-zinc-300 text-xs break-words">
                      {chat.provider}: {chat.model}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block mb-0.5">Cost</span>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Coins className="h-3 w-3 text-emerald-400" />
                      <span>
                        {parseFloat(chat.totalCostUsd || "0") === 0 
                          ? "$0.00" 
                          : parseFloat(chat.totalCostUsd || "0") < 0.01 
                            ? `$${parseFloat(chat.totalCostUsd).toFixed(4)}`
                            : `$${parseFloat(chat.totalCostUsd).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block mb-0.5">Messages</span>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <MessageSquare className="h-3 w-3" />
                      <span>{chat.messageCount}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block mb-0.5">Tokens</span>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Database className="h-3 w-3 text-blue-400" />
                      <span>{((chat.totalInputTokens || 0) + (chat.totalOutputTokens || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="col-span-2 mt-2">
                    <Link 
                      href={`/chat/${chat.id}`} 
                      className="flex items-center justify-center gap-2 w-full py-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 rounded-lg transition-colors border border-violet-500/20"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span>View Conversation</span>
                    </Link>
                  </div>
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
