// lib/stores/useUIStore.ts
import { create } from "zustand";

type ModalKey = "logDetail" | "sessionDetail" | "deleteConfirm" | null;

interface UIStore {
  sidebarOpen: boolean;
  activeModal: ModalKey;
  modalData: unknown;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (key: ModalKey, data?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarOpen: true,
  activeModal: null,
  modalData: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  openModal: (key, data = null) => set({ activeModal: key, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));
