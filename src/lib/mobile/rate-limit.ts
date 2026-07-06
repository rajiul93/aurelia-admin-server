import type { NextRequest } from "next/server";
import { TooManyRequestsError } from "@/lib/api/errors";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    "unknown"
  );
}

export function enforceRateLimit(
  req: NextRequest,
  options: {
    scope: string;
    limit: number;
    windowMs: number;
    identity?: string;
  },
) {
  const identity = options.identity ?? getClientIp(req);
  const key = `${options.scope}:${identity}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  if (existing.count >= options.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    );
    throw new TooManyRequestsError(
      "Rate limit exceeded. Try again later.",
      retryAfterSeconds,
    );
  }

  existing.count += 1;
  buckets.set(key, existing);
}

export function getRateLimitIdentity(req: NextRequest, deviceId?: string) {
  const ip = getClientIp(req);
  return deviceId ? `${ip}:${deviceId}` : ip;
}
