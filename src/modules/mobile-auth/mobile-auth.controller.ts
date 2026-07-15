import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import {
  enforceRateLimit,
  getRateLimitIdentity,
} from "@/lib/mobile/rate-limit";
import {
  requireMobileRequest,
  requireMobileSession,
} from "@/lib/mobile/require-mobile";
import {
  otpRequestSchema,
  otpVerifySchema,
  unlockSchema,
} from "./mobile-auth.schema";
import { mobileAuthService } from "./mobile-auth.service";

export const mobileAuthController = {
  async unlock(req: NextRequest) {
    await requireMobileRequest(req);
    const body = await parseBody(req, unlockSchema);

    // Coarse per-IP/phone throttle. The real brute-force guard is the per-account
    // lockout in the service, which survives a restart and an IP change.
    enforceRateLimit(req, {
      scope: "unlock",
      limit: 10,
      windowMs: 15 * 60 * 1000,
      identity: getRateLimitIdentity(req, body.phone),
    });

    const result = await mobileAuthService.unlock(body);
    return success(result);
  },

  async requestOtp(req: NextRequest) {
    await requireMobileRequest(req);
    const body = await parseBody(req, otpRequestSchema);
    enforceRateLimit(req, {
      scope: "otp-request",
      limit: 5,
      windowMs: 15 * 60 * 1000,
      identity: getRateLimitIdentity(req, body.email),
    });

    const result = await mobileAuthService.requestOtp(body);
    return success(result);
  },

  async verifyOtp(req: NextRequest) {
    await requireMobileRequest(req);
    const body = await parseBody(req, otpVerifySchema);
    enforceRateLimit(req, {
      scope: "otp-verify",
      limit: 10,
      windowMs: 15 * 60 * 1000,
      identity: getRateLimitIdentity(req, body.email),
    });

    const result = await mobileAuthService.verifyOtp(body);
    return success(result);
  },

  async listDevices(req: NextRequest) {
    const session = await requireMobileSession(req);
    const devices = await mobileAuthService.listDevices(session.tourAccessId);
    return success(devices);
  },
};
