import { describe, expect, it } from "vitest";

import {
  otpRequestSchema,
  otpVerifySchema,
  unlockSchema,
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

describe("unlockSchema", () => {
  const valid = {
    phone: " +880 1712-345678 ",
    pin: "0417",
    deviceId: "device-abcdefgh",
    platform: "android",
  };

  it("accepts a phone and a 4-digit PIN", () => {
    const result = unlockSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.pin).toBe("0417");
  });

  it("keeps a leading zero in the PIN", () => {
    expect(unlockSchema.safeParse({ ...valid, pin: "0007" }).data?.pin).toBe(
      "0007",
    );
  });

  it("rejects a PIN that is not exactly 4 digits", () => {
    for (const pin of ["123", "12345", "abcd", "12 4", ""]) {
      expect(unlockSchema.safeParse({ ...valid, pin }).success).toBe(false);
    }
  });

  it("rejects a missing phone or an unknown platform", () => {
    expect(unlockSchema.safeParse({ ...valid, phone: "" }).success).toBe(false);
    expect(unlockSchema.safeParse({ ...valid, platform: "web" }).success).toBe(
      false,
    );
  });
});
