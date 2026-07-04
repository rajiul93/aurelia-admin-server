export type StaffRole = "SUPERADMIN" | "ADMIN" | "MANAGER";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  emailVerified: boolean;
};

export type AuthSessionState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
};

export type SetSessionPayload = {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string | null;
  accessTokenExpiresAt: number;
};
