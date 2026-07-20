import { createHash, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/api/errors";

export function getMobileApiKey() {
  return process.env.MOBILE_API_KEY?.trim() ?? "";
}

/**
 * Constant-time comparison over SHA-256 digests.
 *
 * timingSafeEqual throws on a length mismatch, so comparing the raw keys would
 * both crash on a short key and leak the configured length. Hashing first gives
 * two fixed-width (32 byte) buffers, so only equality is observable.
 */
function secretsMatch(provided: string, configured: string) {
  return timingSafeEqual(
    createHash("sha256").update(provided).digest(),
    createHash("sha256").update(configured).digest(),
  );
}

export function requireMobileApiKey(req: NextRequest) {
  const configured = getMobileApiKey();

  if (!configured) {
    // Skipping the check is opt-in and explicit. Keying it off NODE_ENV meant
    // any deployment that did not set NODE_ENV=production (staging, preview
    // builds, plain containers) silently served the whole mobile API unguarded.
    if (process.env.ALLOW_INSECURE_MOBILE_API === "1") {
      return;
    }

    throw new ForbiddenError("Mobile API key is not configured");
  }

  const provided =
    req.headers.get("x-api-key")?.trim() ??
    req.headers.get("X-API-KEY")?.trim() ??
    "";

  if (!provided) {
    throw new UnauthorizedError("Missing x-api-key header");
  }

  if (!secretsMatch(provided, configured)) {
    throw new ForbiddenError("Invalid x-api-key");
  }
}
