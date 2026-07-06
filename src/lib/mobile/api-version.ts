import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { appReleaseRepository } from "@/lib/app-release/app-release.repository";

export async function requireCompatibleApiVersion(req: NextRequest) {
  const config = await appReleaseRepository.getConfig();
  const supported = config.apiVersion;
  const providedRaw =
    req.headers.get("x-api-version")?.trim() ??
    req.nextUrl.searchParams.get("apiVersion")?.trim();

  if (!providedRaw) {
    // Older clients without the header are accepted while we roll out Phase 2.
    return { clientApiVersion: supported, serverApiVersion: supported };
  }

  const clientApiVersion = Number(providedRaw);
  if (!Number.isInteger(clientApiVersion) || clientApiVersion < 1) {
    throw new AppError(400, "INVALID_API_VERSION", "Invalid apiVersion");
  }

  if (clientApiVersion < supported) {
    throw new AppError(
      426,
      "UPGRADE_REQUIRED",
      "This app version is no longer supported. Please update Aurelia.",
      {
        clientApiVersion,
        serverApiVersion: supported,
        forceUpdate: true,
      },
    );
  }

  return { clientApiVersion, serverApiVersion: supported };
}
