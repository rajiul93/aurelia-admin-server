import { z } from "zod";

export const checkoutSchema = z.object({
  planId: z.string().trim().min(1, "Plan is required"),
  deviceCount: z.coerce.number().int().min(1).max(500),
  tourIds: z
    .array(z.string().trim().min(1))
    .min(1, "Select at least one tour"),
});

export const listSubscriptionPurchasesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"])
    .optional(),
  email: z.string().trim().optional(),
});

export const subscriptionPurchaseIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export type CheckoutInput = z.output<typeof checkoutSchema>;
export type ListSubscriptionPurchasesQuery = z.output<
  typeof listSubscriptionPurchasesQuerySchema
>;
