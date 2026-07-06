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
  deviceRevokeSchema,
  otpRequestSchema,
  otpVerifySchema,
} from "./mobile-auth.schema";
import { mobileAuthService } from "./mobile-auth.service";

export const mobileAuthController = {
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

  async revokeDevice(req: NextRequest) {
    const session = await requireMobileSession(req);
    const raw = await req.text();
    const body = raw.trim()
      ? deviceRevokeSchema.parse(JSON.parse(raw))
      : {};
    const result = await mobileAuthService.revokeDevice(session, body);
    return success(result);
  },

  async listDevices(req: NextRequest) {
    const session = await requireMobileSession(req);
    const devices = await mobileAuthService.listDevices(session.tourAccessId);
    return success(devices);
  },
};
