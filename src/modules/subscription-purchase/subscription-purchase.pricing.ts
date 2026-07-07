import { ValidationError } from "@/lib/api/errors";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type PriceInputs = {
  basePrice: number;
  deviceCount: number;
  maxDevicesPerPurchase: number;
  multiDeviceDiscountEnabled: boolean;
  multiDeviceDiscountPercent: number;
};

export type PriceBreakdown = {
  basePrice: number;
  deviceSurcharge: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
};

/**
 * Server-authoritative price calculation — never trust a client-sent amount.
 *
 * Each device costs the plan base price by default (e.g. €5 × 2 = €10).
 * An admin tier can override the surcharge for extra devices. When more than
 * one device is selected, the multi-device discount is subtracted from the
 * subtotal (base + surcharge), e.g. €10 with 10% off = €9.
 */
export function computePrice(input: PriceInputs): PriceBreakdown {
  if (input.deviceCount < 1 || input.deviceCount > input.maxDevicesPerPurchase) {
    throw new ValidationError(
      `Device count must be between 1 and ${input.maxDevicesPerPurchase}`,
    );
  }

  if (input.deviceCount === 1) {
    return {
      basePrice: round2(input.basePrice),
      deviceSurcharge: 0,
      discountPercent: 0,
      discountAmount: 0,
      totalAmount: round2(input.basePrice),
    };
  }

  const discountPercent = input.multiDeviceDiscountEnabled
    ? input.multiDeviceDiscountPercent
    : 0;
  const subtotal = round2(input.basePrice * input.deviceCount);
  const deviceSurcharge = round2(input.basePrice * (input.deviceCount - 1));
  const discountAmount = round2((subtotal * discountPercent) / 100);

  return {
    basePrice: round2(input.basePrice),
    deviceSurcharge,
    discountPercent,
    discountAmount,
    totalAmount: round2(subtotal - discountAmount),
  };
}
