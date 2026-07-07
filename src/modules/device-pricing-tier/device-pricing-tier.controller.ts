import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams } from "@/lib/api/validate";
import {
  createDevicePricingTierSchema,
  devicePricingTierIdParamSchema,
  updateDevicePricingTierSchema,
} from "./device-pricing-tier.schema";
import { devicePricingTierService } from "./device-pricing-tier.service";

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const devicePricingTierController = {
  async list() {
    const tiers = await devicePricingTierService.list();
    return success(tiers);
  },

  async create(req: NextRequest, staffAuthUserId: string) {
    const body = await parseBody(req, createDevicePricingTierSchema);
    const tier = await devicePricingTierService.create(
      body,
      getAuditContext(req, staffAuthUserId),
    );

    return success(tier, { status: 201 });
  },

  async getById(id: string) {
    const tier = await devicePricingTierService.getById(id);
    return success(tier);
  },

  async update(req: NextRequest, id: string, staffAuthUserId: string) {
    const body = await parseBody(req, updateDevicePricingTierSchema);
    const tier = await devicePricingTierService.update(
      id,
      body,
      getAuditContext(req, staffAuthUserId),
    );

    return success(tier);
  },

  async delete(req: NextRequest, id: string, staffAuthUserId: string) {
    await devicePricingTierService.delete(
      id,
      getAuditContext(req, staffAuthUserId),
    );
    return success({ deleted: true });
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, devicePricingTierIdParamSchema).id;
  },
};
