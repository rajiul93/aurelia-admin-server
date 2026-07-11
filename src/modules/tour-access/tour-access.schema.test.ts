import { describe, expect, it } from "vitest";

import {
  createTourAccessSchema,
  listTourAccessQuerySchema,
  updateTourAccessSchema,
} from "./tour-access.schema";

describe("createTourAccessSchema", () => {
  const valid = {
    email: "guest@example.com",
    expiresAt: "2030-01-01T00:00:00.000Z",
    tourIds: ["tour-1"],
  };

  it("accepts a minimal valid payload and applies defaults", () => {
    const result = createTourAccessSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.ticketCount).toBe(1);
    expect(result.data?.allowSubscriptionFeatures).toBe(false);
  });

  it("transforms expiresAt into a Date", () => {
    const result = createTourAccessSchema.safeParse(valid);
    expect(result.data?.expiresAt).toBeInstanceOf(Date);
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

  it("coerces ticketCount and enforces its 1..20 range", () => {
    expect(
      createTourAccessSchema.safeParse({ ...valid, ticketCount: "3" }).data
        ?.ticketCount,
    ).toBe(3);
    expect(
      createTourAccessSchema.safeParse({ ...valid, ticketCount: 21 }).success,
    ).toBe(false);
    expect(
      createTourAccessSchema.safeParse({ ...valid, ticketCount: 0 }).success,
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
