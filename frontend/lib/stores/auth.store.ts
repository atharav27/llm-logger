// lib/stores/auth.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearSessionFlag } from "@/lib/auth/session";
import type { User } from "@/types/auth";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user) => {
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        clearSessionFlag();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "llm-logger-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
