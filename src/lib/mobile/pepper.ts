/**
 * Peppers for the mobile session/OTP hashes.
 *
 * These used to fall back to a constant committed in this repo whenever the env
 * var was unset — including in production, where that turns a stolen DB dump
 * into forgeable session tokens, since the attacker already has the pepper.
 * Follows the precedent in lib/bundle/sign.ts: a dev convenience value off
 * production, a hard failure on it.
 */
export function requirePepper(envName: string, devFallback: string) {
  const configured = process.env[envName]?.trim();

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV !== "production") {
    return devFallback;
  }

  throw new Error(
    `${envName} is not configured. Set it before serving mobile traffic.`,
  );
}
