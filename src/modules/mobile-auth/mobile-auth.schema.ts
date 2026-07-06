import { z } from "zod";

export const otpRequestSchema = z.object({
  email: z.string().trim().email(),
});

export const otpVerifySchema = z.object({
  email: z.string().trim().email(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be a 6-digit code"),
  deviceId: z.string().trim().min(8).max(200),
  deviceName: z.string().trim().max(120).optional(),
  platform: z.enum(["ios", "android"]),
});

export const deviceRevokeSchema = z.object({
  deviceId: z.string().trim().min(8).max(200).optional(),
});

export type OtpRequestInput = z.output<typeof otpRequestSchema>;
export type OtpVerifyInput = z.output<typeof otpVerifySchema>;
export type DeviceRevokeInput = z.output<typeof deviceRevokeSchema>;
