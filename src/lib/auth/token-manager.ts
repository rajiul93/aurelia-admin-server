import { authClient } from "./client";
import { mapNeonUserToAuthUser, getSessionExpiry } from "./session";
import { useAuthStore } from "@/store/auth-store";

let refreshPromise: Promise<string | null> | null = null;

const TOKEN_REFRESH_BUFFER_MS = 30_000;

export async function fetchAndStoreSession() {
  const sessionResponse = await authClient.getSession();

  if (!sessionResponse.data?.user || !sessionResponse.data.session) {
    useAuthStore.getState().clearAuth();
    return null;
  }

  const user = mapNeonUserToAuthUser(sessionResponse.data);

  if (!user) {
    useAuthStore.getState().clearAuth();
    return null;
  }

  const tokenResponse = await authClient.token();
  const accessToken =
    tokenResponse.data?.token ?? sessionResponse.data.session.token;

  useAuthStore.getState().setSession({
    user,
    accessToken,
    accessTokenExpiresAt: getSessionExpiry(
      sessionResponse.data.session.expiresAt,
    ),
    refreshToken: sessionResponse.data.session.token,
  });

  return accessToken;
}

export async function getAccessToken() {
  const { accessToken, accessTokenExpiresAt } = useAuthStore.getState();

  if (
    accessToken &&
    accessTokenExpiresAt &&
    Date.now() < accessTokenExpiresAt - TOKEN_REFRESH_BUFFER_MS
  ) {
    return accessToken;
  }

  return refreshAccessToken();
}

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      return await fetchAndStoreSession();
    } catch {
      useAuthStore.getState().clearAuth();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
