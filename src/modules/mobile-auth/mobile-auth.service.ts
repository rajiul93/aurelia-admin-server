import { createHash, randomInt } from "crypto";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@/lib/api/errors";
import { isOtpEmailConfigured } from "@/lib/email/config";
import { sendOtpEmail } from "@/lib/email/send-otp-email";
import { verifyPin } from "@/lib/mobile/pin";
import {
  createSessionToken,
  hashSessionToken,
} from "@/lib/mobile/session-token";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { utcNoonToTourDate } from "@/lib/tour-date";
import type {
  OtpRequestInput,
  OtpVerifyInput,
  UnlockInput,
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

const ACCESS_INCLUDE = {
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
} as const;

async function findAccessByEmail(email: string) {
  return prisma.tourAccess.findFirst({
    where: { email },
    include: ACCESS_INCLUDE,
    orderBy: { expiresAt: "desc" },
  });
}

const OTP_REQUEST_COOLDOWN_MS = 45 * 1000;

async function assertNotThrottled(email: string) {
  const recent = await prisma.otpChallenge.findFirst({
    where: {
      email,
      purpose: "SIGN_IN",
      consumedAt: null,
      createdAt: { gt: new Date(Date.now() - OTP_REQUEST_COOLDOWN_MS) },
    },
  });

  if (recent) {
    throw new TooManyRequestsError(
      "Please wait before requesting another code.",
      Math.ceil(OTP_REQUEST_COOLDOWN_MS / 1000),
    );
  }
}

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_MS = 15 * 60 * 1000;

/**
 * Deliberately identical for "no such phone" and "wrong PIN". Telling them apart
 * turns the unlock endpoint into an oracle for which phone numbers are buyers.
 */
const INVALID_CREDENTIALS = "Invalid phone number or PIN";

/**
 * The session a device gets after a successful unlock. Shared with verifyOtp so
 * both entry points hand the app the same thing.
 */
async function issueDeviceSession(
  access: { id: string; maxDevices: number },
  activeSessions: { deviceId: string }[],
  input: {
    deviceId: string;
    deviceName?: string;
    platform: "ios" | "android";
  },
) {
  const sessionToken = createSessionToken();
  const sessionTokenHash = hashSessionToken(sessionToken);

  const session = await prisma.deviceSession.upsert({
    where: {
      tourAccessId_deviceId: {
        tourAccessId: access.id,
        deviceId: input.deviceId,
      },
    },
    create: {
      tourAccessId: access.id,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      platform: input.platform,
      sessionTokenHash,
    },
    update: {
      deviceName: input.deviceName,
      platform: input.platform,
      sessionTokenHash,
      lastVerifiedAt: new Date(),
      revokedAt: null,
    },
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

  const alreadyCounted = activeSessions.some(
    (entry) => entry.deviceId === input.deviceId,
  );

  return {
    sessionToken,
    session,
    activeDeviceCount: alreadyCounted
      ? activeSessions.length
      : activeSessions.length + 1,
  };
}

export const mobileAuthService = {
  /**
   * The buyer's only way in: the phone number and 4-digit PIN the admin set and
   * sent them by hand. On success this device is registered against the grant and
   * gets a session token, so the PIN is never needed again on this device.
   */
  async unlock(input: UnlockInput) {
    const phone = normalizePhone(input.phone);

    const access = await prisma.tourAccess.findUnique({
      where: { phone },
      include: ACCESS_INCLUDE,
    });

    if (!access) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    const now = new Date();

    if (access.pinLockedUntil && access.pinLockedUntil > now) {
      const retryAfter = Math.ceil(
        (access.pinLockedUntil.getTime() - now.getTime()) / 1000,
      );
      throw new TooManyRequestsError(
        "Too many incorrect PIN attempts. Try again later.",
        retryAfter,
      );
    }

    if (!(await verifyPin(input.pin, access.pinHash))) {
      const attempts = access.failedPinAttempts + 1;
      const nowLocked = attempts >= MAX_PIN_ATTEMPTS;

      await prisma.tourAccess.update({
        where: { id: access.id },
        data: nowLocked
          ? {
              failedPinAttempts: 0,
              pinLockedUntil: new Date(now.getTime() + PIN_LOCK_MS),
            }
          : { failedPinAttempts: attempts },
      });

      if (nowLocked) {
        throw new TooManyRequestsError(
          "Too many incorrect PIN attempts. Try again later.",
          PIN_LOCK_MS / 1000,
        );
      }

      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    // Only past the PIN check do we say anything about the state of the grant —
    // before it, every failure has to look the same to a stranger.
    if (access.status === "REVOKED") {
      throw new ForbiddenError("This access has been revoked. Contact support.");
    }

    if (access.activatedAt > now) {
      throw new ForbiddenError(
        `This tour unlocks on ${access.activatedAt.toISOString().slice(0, 10)}.`,
      );
    }

    if (access.status === "EXPIRED" || access.expiresAt < now) {
      throw new ForbiddenError(
        "This access has expired. Contact support to extend it.",
      );
    }

    const activeSessions = access.deviceSessions;
    const knownDevice = activeSessions.some(
      (session) => session.deviceId === input.deviceId,
    );

    // Admin-controlled: the buyer cannot free a seat themselves.
    if (!knownDevice && activeSessions.length >= access.maxDevices) {
      throw new ForbiddenError(
        `This account is already active on ${access.maxDevices} device${
          access.maxDevices === 1 ? "" : "s"
        }. Contact support to remove one.`,
      );
    }

    const { sessionToken, session, activeDeviceCount } =
      await issueDeviceSession(access, activeSessions, input);

    if (access.failedPinAttempts > 0 || access.pinLockedUntil) {
      await prisma.tourAccess.update({
        where: { id: access.id },
        data: { failedPinAttempts: 0, pinLockedUntil: null },
      });
    }

    return {
      sessionToken,
      sessionId: session.id,
      deviceId: session.deviceId,
      phone: access.phone,
      activatedAt: access.activatedAt.toISOString(),
      expiresAt: access.expiresAt.toISOString(),
      maxDevices: access.maxDevices,
      activeDeviceCount,
      tours: access.tours
        .filter((entry) => entry.tour.publishStatus === "PUBLISHED")
        .map((entry) => ({
          id: entry.tour.id,
          slug: entry.tour.slug,
          // Admin-set visit schedule; seeds the app's prep reminders on unlock.
          tourDate: utcNoonToTourDate(entry.tourDate),
          startTime: entry.startTime,
        })),
    };
  },

  /**
   * Legacy email sign-in, kept for grants that carry an email (self-service
   * Stripe buyers). It can no longer auto-provision a grant for an unknown
   * email: a grant now needs a phone and a PIN, which only the admin can set.
   */
  async requestOtp(input: OtpRequestInput) {
    const email = normalizeEmail(input.email);

    await assertNotThrottled(email);

    const access = await findAccessByEmail(email);

    if (!access) {
      throw new NotFoundError("No tour access found for this email.");
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
    const access = await findAccessByEmail(email);

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
    const knownDevice = activeSessions.some(
      (session) => session.deviceId === input.deviceId,
    );

    if (!knownDevice && activeSessions.length >= access.maxDevices) {
      throw new ForbiddenError(
        `This account is already active on ${access.maxDevices} device${
          access.maxDevices === 1 ? "" : "s"
        }. Contact support to remove one.`,
      );
    }

    const { sessionToken, session, activeDeviceCount } =
      await issueDeviceSession(access, activeSessions, input);

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    return {
      sessionToken,
      sessionId: session.id,
      deviceId: session.deviceId,
      email: access.email,
      expiresAt: access.expiresAt.toISOString(),
      maxDevices: access.maxDevices,
      activeDeviceCount,
      tours: access.tours
        .filter((entry) => entry.tour.publishStatus === "PUBLISHED")
        .map((entry) => ({
          id: entry.tour.id,
          slug: entry.tour.slug,
          // Admin-set visit schedule; seeds the app's prep reminders on unlock.
          tourDate: utcNoonToTourDate(entry.tourDate),
          startTime: entry.startTime,
        })),
    };
  },

  // Devices are removed by the admin only (tour-access sessions endpoints); a
  // buyer cannot free a seat themselves, or a single grant could be passed
  // around indefinitely by swapping devices.

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
