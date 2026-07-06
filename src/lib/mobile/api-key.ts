import type { NextRequest } from "next/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/api/errors";

export function getMobileApiKey() {
  return process.env.MOBILE_API_KEY?.trim() ?? "";
}

export function requireMobileApiKey(req: NextRequest) {
  const configured = getMobileApiKey();

  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenError("Mobile API key is not configured");
    }
    // Dev fallback so local mobile work can start without env setup.
    return;
  }

  const provided =
    req.headers.get("x-api-key")?.trim() ??
    req.headers.get("X-API-KEY")?.trim() ??
    "";

  if (!provided) {
    throw new UnauthorizedError("Missing x-api-key header");
  }

  if (provided !== configured) {
    throw new ForbiddenError("Invalid x-api-key");
  }
}
