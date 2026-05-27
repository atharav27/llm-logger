// lib/stores/chat.store.ts
import { create } from "zustand";
import type { LogStatus, LLMLog } from "@/types/log";

interface ChatFilters {
  search: string;
  model: string;
  provider: string;
  status: LogStatus | "";
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

interface ChatStore {
  // Filters state & actions
  filters: ChatFilters;
  setSearch: (search: string) => void;
  setModel: (model: string) => void;
  setProvider: (provider: string) => void;
  setStatus: (status: LogStatus | "") => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  resetFilters: () => void;

  // Real-time stream controls for log logging
  isStreamingActive: boolean;
  setStreamingActive: (active: boolean) => void;
  liveLogs: LLMLog[];
  addLiveLog: (log: LLMLog) => void;
  clearLiveLogs: () => void;

  // Drawer / Selection IDs
  selectedLogId: string | null;
  setSelectedLogId: (id: string | null) => void;
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;

  // Active Interactive Chat Playground States
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  activeConversation: any | null; // Detailed conversation details
  setActiveConversation: (conv: any | null) => void;
  
  // Playground SSE Response Streaming State
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
  streamingContent: string;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
}

const defaultFilters: ChatFilters = {
  search: "",
  model: "",
  provider: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  pageSize: 20,
};

export const useChatStore = create<ChatStore>()((set) => ({
  // Filters state & actions
  filters: { ...defaultFilters },
  setSearch: (search) =>
    set((state) => ({ filters: { ...state.filters, search, page: 1 } })),
  setModel: (model) =>
    set((state) => ({ filters: { ...state.filters, model, page: 1 } })),
  setProvider: (provider) =>
    set((state) => ({ filters: { ...state.filters, provider, page: 1 } })),
  setStatus: (status) =>
    set((state) => ({ filters: { ...state.filters, status, page: 1 } })),
  setDateFrom: (dateFrom) =>
    set((state) => ({ filters: { ...state.filters, dateFrom, page: 1 } })),
  setDateTo: (dateTo) =>
    set((state) => ({ filters: { ...state.filters, dateTo, page: 1 } })),
  setPage: (page) =>
    set((state) => ({ filters: { ...state.filters, page } })),
  setPageSize: (pageSize) =>
    set((state) => ({ filters: { ...state.filters, pageSize, page: 1 } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),

  // Real-time stream state & actions
  isStreamingActive: true, // active by default
  setStreamingActive: (active) => set({ isStreamingActive: active }),
  liveLogs: [],
  addLiveLog: (log) =>
    set((state) => {
      const newLogs = [log, ...state.liveLogs].slice(0, 100);
      return { liveLogs: newLogs };
    }),
  clearLiveLogs: () => set({ liveLogs: [] }),

  // Modal/Drawer selections
  selectedLogId: null,
  setSelectedLogId: (selectedLogId) => set({ selectedLogId }),
  selectedSessionId: null,
  setSelectedSessionId: (selectedSessionId) => set({ selectedSessionId, activeConversationId: selectedSessionId }),

  // Active Interactive Chat Playground States
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id, selectedSessionId: id }),
  activeConversation: null,
  setActiveConversation: (activeConversation) => set({ activeConversation }),

  // Playground SSE Response Streaming State
  isStreaming: false,
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  streamingContent: "",
  setStreamingContent: (streamingContent) => set({ streamingContent }),
  appendStreamingContent: (chunk) => set((state) => ({ streamingContent: state.streamingContent + chunk })),
}));

export default useChatStore;
