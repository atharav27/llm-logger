// lib/hooks/useAuth.ts
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api/client";
import { setSessionFlag } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/stores/auth.store";
import { UI_ROUTES, API_ROUTES } from "@/config/routes";
import type {
  LoginRequest,
  RegisterRequest,
  User,
} from "@/types/auth";

export function useAuth() {
  const { setAuth, logout, user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      await apiFetch(API_ROUTES.AUTH.LOGIN, {
        method: "POST",
        body: credentials,
        skipAuthRetry: true,
      });

      setSessionFlag();
      const userProfile = await apiFetch<User>(API_ROUTES.AUTH.ME, {
        method: "GET",
      });
      return userProfile;
    },
    onSuccess: (userProfile) => {
      setAuth(userProfile);
      router.push(UI_ROUTES.CHAT);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (details: RegisterRequest) => {
      await apiFetch(API_ROUTES.AUTH.REGISTER, {
        method: "POST",
        body: details,
        skipAuthRetry: true,
      });

      setSessionFlag();
      const userProfile = await apiFetch<User>(API_ROUTES.AUTH.ME, {
        method: "GET",
      });
      return userProfile;
    },
    onSuccess: (userProfile) => {
      setAuth(userProfile);
      router.push(UI_ROUTES.CHAT);
    },
  });

  const handleLogout = async () => {
    try {
      await apiFetch(API_ROUTES.AUTH.LOGOUT, {
        method: "POST",
        skipAuthRetry: true,
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    logout();
    router.push(UI_ROUTES.LOGIN);
  };

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: handleLogout,
  };
}
