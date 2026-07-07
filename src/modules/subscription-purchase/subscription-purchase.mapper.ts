import type { Prisma } from "@/generated/prisma/client";

type PurchaseWithRelations = Prisma.SubscriptionPurchaseGetPayload<{
  include: {
    plan: { select: { id: true; name: true; durationInDays: true } };
    tours: { include: { tour: { select: { id: true; slug: true } } } };
  };
}>;

export function toSubscriptionPurchaseDto(purchase: PurchaseWithRelations) {
  return {
    id: purchase.id,
    email: purchase.email,
    plan: purchase.plan,
    deviceCount: purchase.deviceCount,
    basePriceAtPurchase: purchase.basePriceAtPurchase.toNumber(),
    deviceSurchargeAtPurchase: purchase.deviceSurchargeAtPurchase.toNumber(),
    discountPercentAtPurchase: purchase.discountPercentAtPurchase.toNumber(),
    totalAmount: purchase.totalAmount.toNumber(),
    currency: purchase.currency,
    status: purchase.status,
    tourAccessId: purchase.tourAccessId,
    tours: purchase.tours.map((entry) => entry.tour),
    failureReason: purchase.failureReason,
    paidAt: purchase.paidAt?.toISOString() ?? null,
    createdAt: purchase.createdAt.toISOString(),
    updatedAt: purchase.updatedAt.toISOString(),
  };
}

export function toSubscriptionPurchaseDtoList(
  purchases: PurchaseWithRelations[],
) {
  return purchases.map(toSubscriptionPurchaseDto);
}

export type SubscriptionPurchaseDto = ReturnType<
  typeof toSubscriptionPurchaseDto
>;
