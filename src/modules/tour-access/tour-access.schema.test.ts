import { describe, expect, it } from "vitest";

import {
  createTourAccessSchema,
  listTourAccessQuerySchema,
  updateTourAccessSchema,
} from "./tour-access.schema";

describe("createTourAccessSchema", () => {
  const valid = {
    phone: "+8801712345678",
    pin: "0417",
    activatedAt: "2029-01-01T00:00:00.000Z",
    expiresAt: "2030-01-01T00:00:00.000Z",
    tourIds: ["tour-1"],
  };

  it("accepts a minimal valid payload and applies defaults", () => {
    const result = createTourAccessSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.maxDevices).toBe(1);
    expect(result.data?.allowSubscriptionFeatures).toBe(false);
  });

  it("transforms both dates into Dates", () => {
    const result = createTourAccessSchema.safeParse(valid);
    expect(result.data?.activatedAt).toBeInstanceOf(Date);
    expect(result.data?.expiresAt).toBeInstanceOf(Date);
  });

  it("requires the PIN to be exactly 4 digits, leading zeros kept", () => {
    expect(createTourAccessSchema.safeParse({ ...valid, pin: "0007" }).data?.pin).toBe(
      "0007",
    );
    for (const pin of ["123", "12345", "abcd", ""]) {
      expect(createTourAccessSchema.safeParse({ ...valid, pin }).success).toBe(
        false,
      );
    }
  });

  it("requires a phone number", () => {
    expect(createTourAccessSchema.safeParse({ ...valid, phone: "" }).success).toBe(
      false,
    );
  });

  it("rejects an expiry that is not after the activation date", () => {
    expect(
      createTourAccessSchema.safeParse({
        ...valid,
        activatedAt: "2030-01-01T00:00:00.000Z",
        expiresAt: "2029-01-01T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("treats the email as optional", () => {
    expect(createTourAccessSchema.safeParse(valid).success).toBe(true);
    expect(
      createTourAccessSchema.safeParse({ ...valid, email: "not-an-email" })
        .success,
    ).toBe(false);
  });

  it("rejects an invalid expiration date", () => {
    expect(
      createTourAccessSchema.safeParse({ ...valid, expiresAt: "not-a-date" })
        .success,
    ).toBe(false);
  });

  it("requires at least one tour", () => {
    expect(
      createTourAccessSchema.safeParse({ ...valid, tourIds: [] }).success,
    ).toBe(false);
  });

  it("coerces maxDevices and enforces its 1..20 range", () => {
    expect(
      createTourAccessSchema.safeParse({ ...valid, maxDevices: "3" }).data
        ?.maxDevices,
    ).toBe(3);
    expect(
      createTourAccessSchema.safeParse({ ...valid, maxDevices: 21 }).success,
    ).toBe(false);
    expect(
      createTourAccessSchema.safeParse({ ...valid, maxDevices: 0 }).success,
    ).toBe(false);
  });
});

describe("updateTourAccessSchema", () => {
  it("requires at least one field", () => {
    expect(updateTourAccessSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a single-field update", () => {
    expect(
      updateTourAccessSchema.safeParse({ status: "REVOKED" }).success,
    ).toBe(true);
  });

  it("accepts a PIN reset on its own", () => {
    expect(updateTourAccessSchema.safeParse({ pin: "9012" }).success).toBe(true);
    expect(updateTourAccessSchema.safeParse({ pin: "90" }).success).toBe(false);
  });

  it("allows clearing the email", () => {
    expect(updateTourAccessSchema.safeParse({ email: null }).success).toBe(true);
  });

  it("rejects an expiry before the activation date when both are given", () => {
    expect(
      updateTourAccessSchema.safeParse({
        activatedAt: "2030-01-01T00:00:00.000Z",
        expiresAt: "2029-01-01T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown status value", () => {
    expect(
      updateTourAccessSchema.safeParse({ status: "EXPIRED" }).success,
    ).toBe(false);
  });
});

describe("listTourAccessQuerySchema", () => {
  it("defaults page and limit", () => {
    const result = listTourAccessQuerySchema.safeParse({});
    expect(result.data).toMatchObject({ page: 1, limit: 20 });
  });

  it("caps the limit at 100", () => {
    expect(
      listTourAccessQuerySchema.safeParse({ limit: 500 }).success,
    ).toBe(false);
  });
});
