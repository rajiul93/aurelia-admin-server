import { NotFoundError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
import {
  toDevicePricingTierDto,
  toDevicePricingTierDtoList,
} from "./device-pricing-tier.mapper";
import { devicePricingTierRepository } from "./device-pricing-tier.repository";
import type {
  CreateDevicePricingTierInput,
  UpdateDevicePricingTierInput,
} from "./device-pricing-tier.schema";

export const devicePricingTierService = {
  async list() {
    const tiers = await devicePricingTierRepository.findMany();
    return toDevicePricingTierDtoList(tiers);
  },

  async getById(id: string) {
    const tier = await devicePricingTierRepository.findById(id);
    if (!tier) {
      throw new NotFoundError("Device pricing tier not found");
    }

    return toDevicePricingTierDto(tier);
  },

  async create(input: CreateDevicePricingTierInput, audit?: AuditContext) {
    const tier = await devicePricingTierRepository.create(input);

    await auditService.log({
      module: "device-pricing-tier",
      actionType: "CREATE",
      entityId: tier.id,
      newValue: toDevicePricingTierDto(tier),
      context: audit,
    });

    return toDevicePricingTierDto(tier);
  },

  async update(
    id: string,
    input: UpdateDevicePricingTierInput,
    audit?: AuditContext,
  ) {
    const existing = await devicePricingTierRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Device pricing tier not found");
    }

    const tier = await devicePricingTierRepository.update(id, input);

    await auditService.log({
      module: "device-pricing-tier",
      actionType: "UPDATE",
      entityId: tier.id,
      previousValue: toDevicePricingTierDto(existing),
      newValue: toDevicePricingTierDto(tier),
      context: audit,
    });

    return toDevicePricingTierDto(tier);
  },

  async delete(id: string, audit?: AuditContext) {
    const existing = await devicePricingTierRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Device pricing tier not found");
    }

    await devicePricingTierRepository.delete(id);

    await auditService.log({
      module: "device-pricing-tier",
      actionType: "DELETE",
      entityId: id,
      previousValue: toDevicePricingTierDto(existing),
      context: audit,
    });
  },
};
