import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl || !cookieSecret) {
  console.warn(
    "[auth] NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET are not configured.",
  );
}

export const auth = createNeonAuth({
  baseUrl: baseUrl ?? "https://placeholder.neonauth.local/auth",
  cookies: {
    secret:
      cookieSecret ??
      "development-only-cookie-secret-32chars-minimum-length",
    sameSite: "lax",
  },
});
