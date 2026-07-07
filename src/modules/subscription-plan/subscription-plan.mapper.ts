import type { SubscriptionPlan } from "@/generated/prisma/client";

export function toSubscriptionPlanDto(plan: SubscriptionPlan) {
  return {
    id: plan.id,
    name: plan.name,
    durationInDays: plan.durationInDays,
    basePrice: plan.basePrice.toNumber(),
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

export function toSubscriptionPlanDtoList(plans: SubscriptionPlan[]) {
  return plans.map(toSubscriptionPlanDto);
}

export type SubscriptionPlanDto = ReturnType<typeof toSubscriptionPlanDto>;
