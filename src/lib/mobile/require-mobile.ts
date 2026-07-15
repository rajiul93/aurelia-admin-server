import type { NextRequest } from "next/server";
import { UnauthorizedError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { requireMobileApiKey } from "./api-key";
import { requireCompatibleApiVersion } from "./api-version";
import { hashSessionToken } from "./session-token";

export type MobileSessionContext = {
  sessionId: string;
  deviceId: string;
  tourAccessId: string;
  phone: string;
  email: string | null;
  maxDevices: number;
  allowSubscriptionFeatures: boolean;
  activatedAt: Date;
  expiresAt: Date;
  accessStatus: string;
};

export async function requireMobileRequest(req: NextRequest) {
  requireMobileApiKey(req);
  const apiVersion = await requireCompatibleApiVersion(req);
  return apiVersion;
}

async function resolveSessionFromRequest(req: NextRequest) {
  await requireMobileRequest(req);

  const authorization = req.headers.get("authorization")?.trim() ?? "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const headerToken = req.headers.get("x-session-token")?.trim();
  const token = bearer || headerToken;

  if (!token) {
    throw new UnauthorizedError("Missing device session token");
  }

  const session = await prisma.deviceSession.findUnique({
    where: { sessionTokenHash: hashSessionToken(token) },
    include: {
      tourAccess: true,
    },
  });

  if (!session || session.revokedAt) {
    throw new UnauthorizedError("Invalid or revoked device session");
  }

  await prisma.deviceSession.update({
    where: { id: session.id },
    data: { lastVerifiedAt: new Date() },
  });

  return session;
}

function toSessionContext(
  session: Awaited<ReturnType<typeof resolveSessionFromRequest>>,
): MobileSessionContext {
  const access = session.tourAccess;

  return {
    sessionId: session.id,
    deviceId: session.deviceId,
    tourAccessId: access.id,
    phone: access.phone,
    email: access.email,
    maxDevices: access.maxDevices,
    allowSubscriptionFeatures: access.allowSubscriptionFeatures,
    activatedAt: access.activatedAt,
    expiresAt: access.expiresAt,
    accessStatus: access.status,
  };
}

export async function requireMobileSession(
  req: NextRequest,
): Promise<MobileSessionContext> {
  const session = await resolveSessionFromRequest(req);
  const access = session.tourAccess;
  const now = Date.now();

  // The grant is only usable inside its window. A device that unlocked before
  // expiry keeps its session token, so expiry has to be re-checked on every
  // request, not just at unlock.
  const usable =
    access.status === "ACTIVE" &&
    access.activatedAt.getTime() <= now &&
    access.expiresAt.getTime() >= now;

  if (!usable) {
    throw new UnauthorizedError("Tour access is no longer active");
  }

  return toSessionContext(session);
}

/**
 * Same device-session lookup as requireMobileSession, but does not reject
 * expired/revoked access — used by routes that must stay reachable for a
 * signed-in user whose subscription has lapsed or never started (e.g.
 * entitlements status, subscription checkout).
 */
export async function requireMobileIdentity(
  req: NextRequest,
): Promise<MobileSessionContext> {
  const session = await resolveSessionFromRequest(req);
  return toSessionContext(session);
}
