import { z } from "zod";

export const tourAccessFormSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  expiresAt: z.string().trim().min(1, "Expiration date is required"),
  ticketCount: z.number().int().min(1).max(20),
  allowSubscriptionFeatures: z.boolean(),
  notes: z.string().trim().max(1000),
  tourIds: z.array(z.string()).min(1, "Select at least one tour"),
});

export type TourAccessFormInput = z.infer<typeof tourAccessFormSchema>;
