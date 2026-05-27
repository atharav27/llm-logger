// lib/stores/useFilterStore.ts
import { create } from "zustand";
import type { LogStatus } from "@/types/log";

interface FilterStore {
  // Log filters
  search: string;
  model: string;
  provider: string;
  status: LogStatus | "";
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;

  // Actions
  setSearch: (search: string) => void;
  setModel: (model: string) => void;
  setProvider: (provider: string) => void;
  setStatus: (status: LogStatus | "") => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  search: "",
  model: "",
  provider: "",
  status: "" as LogStatus | "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  pageSize: 20,
};

export const useFilterStore = create<FilterStore>()((set) => ({
  ...defaultFilters,

  setSearch: (search) => set({ search, page: 1 }),
  setModel: (model) => set({ model, page: 1 }),
  setProvider: (provider) => set({ provider, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setDateFrom: (dateFrom) => set({ dateFrom, page: 1 }),
  setDateTo: (dateTo) => set({ dateTo, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  resetFilters: () => set(defaultFilters),
}));
