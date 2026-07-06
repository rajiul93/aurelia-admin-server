import { createHash, randomInt } from "crypto";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/api/errors";
import { isOtpEmailConfigured } from "@/lib/email/config";
import { sendOtpEmail } from "@/lib/email/send-otp-email";
import {
  createSessionToken,
  hashSessionToken,
} from "@/lib/mobile/session-token";
import { prisma } from "@/lib/prisma";
import type {
  DeviceRevokeInput,
  OtpRequestInput,
  OtpVerifyInput,
} from "./mobile-auth.schema";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashOtpCode(code: string) {
  const pepper = process.env.MOBILE_OTP_PEPPER?.trim() || "aurelia-otp-pepper";
  return createHash("sha256").update(`${pepper}:${code}`).digest("hex");
}

function generateOtpCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

async function findActiveAccessByEmail(email: string) {
  const now = new Date();

  return prisma.tourAccess.findFirst({
    where: {
      email,
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
    include: {
      tours: {
        include: {
          tour: {
            select: {
              id: true,
              slug: true,
              publishStatus: true,
            },
          },
        },
      },
      deviceSessions: {
        where: { revokedAt: null },
      },
    },
    orderBy: { expiresAt: "desc" },
  });
}

export const mobileAuthService = {
  async requestOtp(input: OtpRequestInput) {
    const email = normalizeEmail(input.email);
    const access = await findActiveAccessByEmail(email);

    if (!access) {
      // Do not reveal whether the email exists.
      return {
        sent: true,
        expiresInSeconds: OTP_TTL_MS / 1000,
        ...(process.env.NODE_ENV !== "production"
          ? { devHint: "No active access for this email" }
          : {}),
      };
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const expiresInMinutes = OTP_TTL_MS / 60_000;

    await prisma.otpChallenge.updateMany({
      where: {
        email,
        purpose: "SIGN_IN",
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    const challenge = await prisma.otpChallenge.create({
      data: {
        email,
        codeHash: hashOtpCode(code),
        purpose: "SIGN_IN",
        expiresAt,
        tourAccessId: access.id,
      },
    });

    if (isOtpEmailConfigured()) {
      try {
        await sendOtpEmail({ to: email, code, expiresInMinutes });
        console.info(`[mobile-otp] email sent to ${email}`);
      } catch (error) {
        console.error("[mobile-otp] email delivery failed", error);
        await prisma.otpChallenge.delete({ where: { id: challenge.id } });
        throw new AppError(
          503,
          "EMAIL_DELIVERY_FAILED",
          "Unable to send verification email. Please try again.",
        );
      }
    } else if (process.env.NODE_ENV !== "production") {
      console.info(`[mobile-otp] ${email} => ${code}`);
    } else {
      await prisma.otpChallenge.delete({ where: { id: challenge.id } });
      throw new AppError(
        503,
        "EMAIL_NOT_CONFIGURED",
        "Unable to send verification email. Please try again later.",
      );
    }

    return {
      sent: true,
      expiresInSeconds: OTP_TTL_MS / 1000,
      ...(process.env.NODE_ENV !== "production"
        ? {
            devCode: code,
            ...(isOtpEmailConfigured()
              ? {
                  devHint:
                    "Resend test sender only delivers to your verified Resend account email unless you verify a domain.",
                }
              : {}),
          }
        : {}),
    };
  },

  async verifyOtp(input: OtpVerifyInput) {
    const email = normalizeEmail(input.email);
    const access = await findActiveAccessByEmail(email);

    if (!access) {
      throw new UnauthorizedError("Invalid email or OTP");
    }

    const challenge = await prisma.otpChallenge.findFirst({
      where: {
        email,
        purpose: "SIGN_IN",
        consumedAt: null,
        expiresAt: { gt: new Date() },
        tourAccessId: access.id,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      throw new UnauthorizedError("OTP expired or not found. Request a new code.");
    }

    if (challenge.attemptCount >= MAX_OTP_ATTEMPTS) {
      throw new ForbiddenError("Too many OTP attempts. Request a new code.");
    }

    const valid = challenge.codeHash === hashOtpCode(input.code);
    if (!valid) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attemptCount: { increment: 1 } },
      });
      throw new UnauthorizedError("Invalid email or OTP");
    }

    const activeSessions = access.deviceSessions;
    const existingActiveForDevice = activeSessions.find(
      (session) => session.deviceId === input.deviceId,
    );

    if (
      !existingActiveForDevice &&
      activeSessions.length >= access.ticketCount
    ) {
      throw new ForbiddenError(
        "Device seat limit reached. Revoke another device before signing in.",
      );
    }

    const sessionToken = createSessionToken();
    const sessionTokenHash = hashSessionToken(sessionToken);

    const existingSession = await prisma.deviceSession.findUnique({
      where: {
        tourAccessId_deviceId: {
          tourAccessId: access.id,
          deviceId: input.deviceId,
        },
      },
    });

    const session = existingSession
      ? await prisma.deviceSession.update({
          where: { id: existingSession.id },
          data: {
            deviceName: input.deviceName,
            platform: input.platform,
            sessionTokenHash,
            lastVerifiedAt: new Date(),
            revokedAt: null,
          },
        })
      : await prisma.deviceSession.create({
          data: {
            tourAccessId: access.id,
            deviceId: input.deviceId,
            deviceName: input.deviceName,
            platform: input.platform,
            sessionTokenHash,
          },
        });

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    await prisma.deviceRegistration.upsert({
      where: { deviceId: input.deviceId },
      create: {
        deviceId: input.deviceId,
        deviceName: input.deviceName,
        platform: input.platform,
        tourAccessId: access.id,
      },
      update: {
        deviceName: input.deviceName,
        platform: input.platform,
        tourAccessId: access.id,
        revokedAt: null,
        lastActiveAt: new Date(),
      },
    });

    return {
      sessionToken,
      sessionId: session.id,
      deviceId: session.deviceId,
      email: access.email,
      expiresAt: access.expiresAt.toISOString(),
      ticketCount: access.ticketCount,
      activeDeviceCount: existingActiveForDevice
        ? activeSessions.length
        : activeSessions.length + 1,
      tours: access.tours
        .filter((entry) => entry.tour.publishStatus === "PUBLISHED")
        .map((entry) => ({
          id: entry.tour.id,
          slug: entry.tour.slug,
        })),
    };
  },

  async revokeDevice(
    session: {
      sessionId: string;
      tourAccessId: string;
      deviceId: string;
    },
    input: DeviceRevokeInput,
  ) {
    const targetDeviceId = input.deviceId ?? session.deviceId;

    const target = await prisma.deviceSession.findFirst({
      where: {
        tourAccessId: session.tourAccessId,
        deviceId: targetDeviceId,
        revokedAt: null,
      },
    });

    if (!target) {
      throw new NotFoundError("Active device session not found");
    }

    await prisma.deviceSession.update({
      where: { id: target.id },
      data: {
        revokedAt: new Date(),
        sessionTokenHash: null,
      },
    });

    await prisma.deviceRegistration.updateMany({
      where: { deviceId: targetDeviceId, tourAccessId: session.tourAccessId },
      data: { revokedAt: new Date() },
    });

    return { revoked: true, deviceId: targetDeviceId };
  },

  async listDevices(tourAccessId: string) {
    const sessions = await prisma.deviceSession.findMany({
      where: { tourAccessId, revokedAt: null },
      orderBy: { lastVerifiedAt: "desc" },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      platform: session.platform,
      lastVerifiedAt: session.lastVerifiedAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
    }));
  },
};
