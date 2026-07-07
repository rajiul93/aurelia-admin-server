import type { DevicePricingTier } from "@/generated/prisma/client";

export function toDevicePricingTierDto(tier: DevicePricingTier) {
  return {
    id: tier.id,
    deviceCount: tier.deviceCount,
    additionalPrice: tier.additionalPrice.toNumber(),
    isActive: tier.isActive,
    createdAt: tier.createdAt.toISOString(),
    updatedAt: tier.updatedAt.toISOString(),
  };
}

export function toDevicePricingTierDtoList(tiers: DevicePricingTier[]) {
  return tiers.map(toDevicePricingTierDto);
}

export type DevicePricingTierDto = ReturnType<typeof toDevicePricingTierDto>;
