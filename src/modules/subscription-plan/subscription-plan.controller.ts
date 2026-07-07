import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams } from "@/lib/api/validate";
import {
  createSubscriptionPlanSchema,
  subscriptionPlanIdParamSchema,
  updateSubscriptionPlanSchema,
} from "./subscription-plan.schema";
import { subscriptionPlanService } from "./subscription-plan.service";

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const subscriptionPlanController = {
  async list() {
    const plans = await subscriptionPlanService.list();
    return success(plans);
  },

  async create(req: NextRequest, staffAuthUserId: string) {
    const body = await parseBody(req, createSubscriptionPlanSchema);
    const plan = await subscriptionPlanService.create(
      body,
      getAuditContext(req, staffAuthUserId),
    );

    return success(plan, { status: 201 });
  },

  async getById(id: string) {
    const plan = await subscriptionPlanService.getById(id);
    return success(plan);
  },

  async update(req: NextRequest, id: string, staffAuthUserId: string) {
    const body = await parseBody(req, updateSubscriptionPlanSchema);
    const plan = await subscriptionPlanService.update(
      id,
      body,
      getAuditContext(req, staffAuthUserId),
    );

    return success(plan);
  },

  async delete(req: NextRequest, id: string, staffAuthUserId: string) {
    await subscriptionPlanService.delete(
      id,
      getAuditContext(req, staffAuthUserId),
    );
    return success({ deleted: true });
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, subscriptionPlanIdParamSchema).id;
  },
};
