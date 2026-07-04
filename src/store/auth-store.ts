import { create } from "zustand";
import type { AuthUser, SetSessionPayload } from "@/types/auth";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  setSession: (payload: SetSessionPayload) => void;
  setInitialized: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<Pick<AuthUser, "name" | "email">>) => void;
};

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: true,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setSession: ({ user, accessToken, refreshToken, accessTokenExpiresAt }) =>
    set({
      user,
      accessToken,
      refreshToken: refreshToken ?? null,
      accessTokenExpiresAt,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
    }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () =>
    set({
      ...initialState,
      isInitialized: true,
      isLoading: false,
    }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));
