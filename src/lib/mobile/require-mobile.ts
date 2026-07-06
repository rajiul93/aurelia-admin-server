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
  email: string;
  ticketCount: number;
  allowSubscriptionFeatures: boolean;
  expiresAt: Date;
  accessStatus: string;
};

export async function requireMobileRequest(req: NextRequest) {
  requireMobileApiKey(req);
  const apiVersion = await requireCompatibleApiVersion(req);
  return apiVersion;
}

export async function requireMobileSession(
  req: NextRequest,
): Promise<MobileSessionContext> {
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

  const access = session.tourAccess;
  const expired =
    access.status === "REVOKED" ||
    access.status === "EXPIRED" ||
    access.expiresAt.getTime() < Date.now();

  if (expired) {
    throw new UnauthorizedError("Tour access is no longer active");
  }

  await prisma.deviceSession.update({
    where: { id: session.id },
    data: { lastVerifiedAt: new Date() },
  });

  return {
    sessionId: session.id,
    deviceId: session.deviceId,
    tourAccessId: access.id,
    email: access.email,
    ticketCount: access.ticketCount,
    allowSubscriptionFeatures: access.allowSubscriptionFeatures,
    expiresAt: access.expiresAt,
    accessStatus: access.status,
  };
}
