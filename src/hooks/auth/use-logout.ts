"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { useAuthStore } from "@/store/auth-store";

export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      await authClient.signOut();
    } finally {
      clearAuth();
      router.push(AUTH_ROUTES.login);
      router.refresh();
      setIsLoggingOut(false);
    }
  }, [clearAuth, router]);

  return { logout, isLoggingOut };
}
