import { z } from "zod";

export const checkoutSchema = z.object({
  planId: z.string().trim().min(1, "Plan is required"),
  deviceCount: z.coerce.number().int().min(1).max(500),
  tourIds: z
    .array(z.string().trim().min(1))
    .min(1, "Select at least one tour"),
  /**
   * Buyers are identified by phone now, so most grants carry no email. Stripe
   * still needs one for the receipt — the app asks for it at checkout, and it is
   * stored back on the grant. Optional here because a grant that already has an
   * email (an earlier self-service purchase) does not need to re-supply it.
   */
  email: z.string().trim().email().optional(),
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
