import { describe, expect, it } from "vitest";

import { ValidationError } from "@/lib/api/errors";
import { computePrice, type PriceInputs } from "./subscription-purchase.pricing";

const base: PriceInputs = {
  basePrice: 5,
  deviceCount: 1,
  maxDevicesPerPurchase: 10,
  multiDeviceDiscountEnabled: true,
  multiDeviceDiscountPercent: 10,
};

describe("computePrice", () => {
  it("charges the plain base price for a single device (no surcharge/discount)", () => {
    expect(computePrice({ ...base, deviceCount: 1 })).toEqual({
      basePrice: 5,
      deviceSurcharge: 0,
      discountPercent: 0,
      discountAmount: 0,
      totalAmount: 5,
    });
  });

  it("applies per-device surcharge and multi-device discount", () => {
    // 2 × €5 = €10 subtotal, €5 surcharge for the extra device, 10% off = €1 → €9.
    expect(computePrice({ ...base, deviceCount: 2 })).toEqual({
      basePrice: 5,
      deviceSurcharge: 5,
      discountPercent: 10,
      discountAmount: 1,
      totalAmount: 9,
    });

    // 3 × €5 = €15 subtotal, €10 surcharge, 10% off = €1.5 → €13.5.
    expect(computePrice({ ...base, deviceCount: 3 })).toEqual({
      basePrice: 5,
      deviceSurcharge: 10,
      discountPercent: 10,
      discountAmount: 1.5,
      totalAmount: 13.5,
    });
  });

  it("omits the discount when multi-device discount is disabled", () => {
    const result = computePrice({
      ...base,
      deviceCount: 2,
      multiDeviceDiscountEnabled: false,
    });

    expect(result.discountPercent).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.totalAmount).toBe(10);
  });

  it("rounds money to two decimals", () => {
    // 3 × €9.99 = €29.97 subtotal, 10% = €2.997 → rounds to €3.00, total €26.97.
    const result = computePrice({ ...base, basePrice: 9.99, deviceCount: 3 });

    expect(result.discountAmount).toBe(3);
    expect(result.totalAmount).toBe(26.97);
  });

  it("allows the maximum device count (boundary)", () => {
    expect(() =>
      computePrice({ ...base, deviceCount: 10, maxDevicesPerPurchase: 10 }),
    ).not.toThrow();
  });

  it("rejects a device count below 1", () => {
    expect(() => computePrice({ ...base, deviceCount: 0 })).toThrow(
      ValidationError,
    );
  });

  it("rejects a device count above the max", () => {
    expect(() =>
      computePrice({ ...base, deviceCount: 11, maxDevicesPerPurchase: 10 }),
    ).toThrow(ValidationError);
  });
});
