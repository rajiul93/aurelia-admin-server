export type DevicePricingTier = {
  id: string;
  deviceCount: number;
  additionalPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateDevicePricingTierPayload = {
  deviceCount: number;
  additionalPrice: number;
  isActive?: boolean;
};

export type UpdateDevicePricingTierPayload =
  Partial<CreateDevicePricingTierPayload>;
