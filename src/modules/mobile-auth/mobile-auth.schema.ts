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

/** Phone + PIN unlock. The PIN is what the admin sent the buyer by hand. */
export const unlockSchema = z.object({
  phone: z.string().trim().min(6, "Phone number is required").max(30),
  pin: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "PIN must be 4 digits"),
  deviceId: z.string().trim().min(8).max(200),
  deviceName: z.string().trim().max(120).optional(),
  platform: z.enum(["ios", "android"]),
});

export type OtpRequestInput = z.output<typeof otpRequestSchema>;
export type OtpVerifyInput = z.output<typeof otpVerifySchema>;
export type UnlockInput = z.output<typeof unlockSchema>;
