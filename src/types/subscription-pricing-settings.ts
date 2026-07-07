export type SubscriptionPricingSettings = {
  currency: string;
  multiDeviceDiscountEnabled: boolean;
  multiDeviceDiscountPercent: number;
  maxDevicesPerPurchase: number;
  updatedAt: string;
};

export type UpdateSubscriptionPricingSettingsPayload =
  Partial<SubscriptionPricingSettings>;
