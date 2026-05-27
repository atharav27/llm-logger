// providers/auth-provider.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { refreshAccessToken } from "@/lib/api/auth-refresh";
import { setSessionFlag } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/stores/auth.store";
import { API_ROUTES } from "@/config/routes";
import type { User } from "@/types/auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const initAuth = async () => {
      const { setAuth, logout } = useAuthStore.getState();

      const hydrateUser = async (): Promise<boolean> => {
        try {
          const userProfile = await apiFetch<User>(API_ROUTES.AUTH.ME, {
            method: "GET",
            skipAuthRetry: true,
          });
          setAuth(userProfile);
          setSessionFlag();
          return true;
        } catch {
          return false;
        }
      };

      if (await hydrateUser()) {
        return;
      }

      try {
        await refreshAccessToken();
        setSessionFlag();
        if (!(await hydrateUser())) {
          logout();
        }
      } catch {
        logout();
      }
    };

    initAuth().finally(() => setIsCheckingAuth(false));
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 mb-6 animate-bounce">
            <Bot className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white mb-2 font-sans">
            LLM Logger
          </h2>
          <p className="text-sm text-zinc-400 mb-6 font-sans">
            Verifying your session...
          </p>

          <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0%   { transform: translateX(-200%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthProvider;
