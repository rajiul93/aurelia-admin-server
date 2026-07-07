import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
import {
  toSubscriptionPlanDto,
  toSubscriptionPlanDtoList,
} from "./subscription-plan.mapper";
import { subscriptionPlanRepository } from "./subscription-plan.repository";
import type {
  CreateSubscriptionPlanInput,
  UpdateSubscriptionPlanInput,
} from "./subscription-plan.schema";

export const subscriptionPlanService = {
  async list() {
    const plans = await subscriptionPlanRepository.findMany();
    return toSubscriptionPlanDtoList(plans);
  },

  async getById(id: string) {
    const plan = await subscriptionPlanRepository.findById(id);
    if (!plan) {
      throw new NotFoundError("Subscription plan not found");
    }

    return toSubscriptionPlanDto(plan);
  },

  async create(input: CreateSubscriptionPlanInput, audit?: AuditContext) {
    const plan = await subscriptionPlanRepository.create(input);

    await auditService.log({
      module: "subscription-plan",
      actionType: "CREATE",
      entityId: plan.id,
      newValue: toSubscriptionPlanDto(plan),
      context: audit,
    });

    return toSubscriptionPlanDto(plan);
  },

  async update(
    id: string,
    input: UpdateSubscriptionPlanInput,
    audit?: AuditContext,
  ) {
    const existing = await subscriptionPlanRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Subscription plan not found");
    }

    const plan = await subscriptionPlanRepository.update(id, input);

    await auditService.log({
      module: "subscription-plan",
      actionType: "UPDATE",
      entityId: plan.id,
      previousValue: toSubscriptionPlanDto(existing),
      newValue: toSubscriptionPlanDto(plan),
      context: audit,
    });

    return toSubscriptionPlanDto(plan);
  },

  async delete(id: string, audit?: AuditContext) {
    const existing = await subscriptionPlanRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Subscription plan not found");
    }

    const purchaseCount = await subscriptionPlanRepository.countPurchases(id);
    if (purchaseCount > 0) {
      throw new ValidationError(
        "Cannot delete a plan with existing purchases. Deactivate it instead.",
      );
    }

    await subscriptionPlanRepository.delete(id);

    await auditService.log({
      module: "subscription-plan",
      actionType: "DELETE",
      entityId: id,
      previousValue: toSubscriptionPlanDto(existing),
      context: audit,
    });
  },
};
