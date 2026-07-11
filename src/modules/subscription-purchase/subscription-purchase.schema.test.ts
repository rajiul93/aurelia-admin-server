import { describe, expect, it } from "vitest";

import {
  checkoutSchema,
  listSubscriptionPurchasesQuerySchema,
} from "./subscription-purchase.schema";

describe("checkoutSchema", () => {
  const valid = { planId: "plan-1", deviceCount: 2, tourIds: ["tour-1"] };

  it("accepts a valid checkout payload", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it("coerces a string deviceCount", () => {
    expect(checkoutSchema.safeParse({ ...valid, deviceCount: "3" }).data
      ?.deviceCount).toBe(3);
  });

  it("requires a plan id", () => {
    expect(checkoutSchema.safeParse({ ...valid, planId: "" }).success).toBe(false);
  });

  it("requires at least one tour", () => {
    expect(checkoutSchema.safeParse({ ...valid, tourIds: [] }).success).toBe(
      false,
    );
  });

  it("enforces the deviceCount 1..500 range", () => {
    expect(checkoutSchema.safeParse({ ...valid, deviceCount: 0 }).success).toBe(
      false,
    );
    expect(
      checkoutSchema.safeParse({ ...valid, deviceCount: 501 }).success,
    ).toBe(false);
  });
});

describe("listSubscriptionPurchasesQuerySchema", () => {
  it("applies page/limit defaults", () => {
    expect(listSubscriptionPurchasesQuerySchema.safeParse({}).data).toMatchObject({
      page: 1,
      limit: 20,
    });
  });

  it("rejects an unknown status", () => {
    expect(
      listSubscriptionPurchasesQuerySchema.safeParse({ status: "DONE" }).success,
    ).toBe(false);
  });
});
