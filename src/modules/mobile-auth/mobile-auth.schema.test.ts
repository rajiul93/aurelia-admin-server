import { describe, expect, it } from "vitest";

import {
  deviceRevokeSchema,
  otpRequestSchema,
  otpVerifySchema,
} from "./mobile-auth.schema";

describe("otpRequestSchema", () => {
  it("accepts and trims a valid email", () => {
    const result = otpRequestSchema.safeParse({ email: "  User@Example.com " });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("User@Example.com");
  });

  it("rejects a malformed email", () => {
    expect(otpRequestSchema.safeParse({ email: "not-an-email" }).success).toBe(
      false,
    );
  });
});

describe("otpVerifySchema", () => {
  const valid = {
    email: "user@example.com",
    code: "123456",
    deviceId: "device-abcdef",
    platform: "ios" as const,
  };

  it("accepts a well-formed verify payload", () => {
    expect(otpVerifySchema.safeParse(valid).success).toBe(true);
  });

  it("requires a 6-digit numeric code", () => {
    expect(otpVerifySchema.safeParse({ ...valid, code: "12345" }).success).toBe(
      false,
    );
    expect(otpVerifySchema.safeParse({ ...valid, code: "abcdef" }).success).toBe(
      false,
    );
  });

  it("enforces the deviceId length bounds", () => {
    expect(otpVerifySchema.safeParse({ ...valid, deviceId: "short" }).success).toBe(
      false,
    );
    expect(
      otpVerifySchema.safeParse({ ...valid, deviceId: "x".repeat(201) }).success,
    ).toBe(false);
  });

  it("only allows ios or android platforms", () => {
    expect(
      otpVerifySchema.safeParse({ ...valid, platform: "web" }).success,
    ).toBe(false);
  });

  it("treats deviceName as optional", () => {
    const withName = otpVerifySchema.safeParse({ ...valid, deviceName: "iPhone" });
    expect(withName.success).toBe(true);
    expect(otpVerifySchema.safeParse(valid).success).toBe(true);
  });
});

describe("deviceRevokeSchema", () => {
  it("allows an empty body (revoke current device)", () => {
    expect(deviceRevokeSchema.safeParse({}).success).toBe(true);
  });

  it("rejects a too-short deviceId when provided", () => {
    expect(deviceRevokeSchema.safeParse({ deviceId: "abc" }).success).toBe(false);
  });
});
