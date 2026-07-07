import { z } from "zod";

export const subscriptionPlanFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  durationInDays: z.number().int().min(1, "Must be at least 1 day").max(3650),
  basePrice: z.number().min(0, "Must be 0 or more"),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export type SubscriptionPlanFormInput = z.infer<
  typeof subscriptionPlanFormSchema
>;
