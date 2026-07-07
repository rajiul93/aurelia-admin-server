export type SubscriptionPlan = {
  id: string;
  name: string;
  durationInDays: number;
  basePrice: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateSubscriptionPlanPayload = {
  name: string;
  durationInDays: number;
  basePrice: number;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateSubscriptionPlanPayload = Partial<CreateSubscriptionPlanPayload>;
