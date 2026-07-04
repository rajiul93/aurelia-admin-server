"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAndStoreSession } from "@/lib/auth/token-manager";
import { useAuthStore } from "@/store/auth-store";

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const setLoading = useAuthStore((state) => state.setLoading);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      setLoading(true);

      try {
        await fetchAndStoreSession();
      } catch {
        if (!cancelled) {
          clearAuth();
        }
      } finally {
        if (!cancelled) {
          setInitialized(true);
          setLoading(false);
          router.refresh();
        }
      }
    }

    void bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, [clearAuth, router, setInitialized, setLoading]);

  return children;
}
