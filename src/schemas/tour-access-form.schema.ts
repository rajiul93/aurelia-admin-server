import { z } from "zod";

export const tourAccessFormSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .min(6, "Phone number is required")
      .max(30, "Phone number is too long"),
    /**
     * Empty when editing: the PIN is write-only, so a blank field means "leave
     * the existing PIN alone" rather than "clear it". The form requires it on
     * create by passing `requirePin`.
     */
    pin: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "PIN must be exactly 4 digits")
      .or(z.literal("")),
    email: z
      .string()
      .trim()
      .email("Enter a valid email or leave this blank")
      .or(z.literal("")),
    activatedAt: z.string().trim().min(1, "Activation date is required"),
    expiresAt: z.string().trim().min(1, "Expiry date is required"),
    maxDevices: z.number().int().min(1).max(20),
    allowSubscriptionFeatures: z.boolean(),
    notes: z.string().trim().max(1000),
    /**
     * One row per selected tour, each carrying an optional planned visit date
     * (YYYY-MM-DD from an `<input type="date">`) and start time (HH:mm). Empty
     * strings mean "not scheduled" and the server normalizes them to null.
     */
    tours: z
      .array(
        z.object({
          tourId: z.string().min(1),
          tourDate: z.string(),
          startTime: z.string(),
        }),
      )
      .min(1, "Select at least one tour"),
  })
  .refine(
    (value) => new Date(value.expiresAt) > new Date(value.activatedAt),
    {
      message: "Expiry date must be after the activation date",
      path: ["expiresAt"],
    },
  );

export type TourAccessFormInput = z.infer<typeof tourAccessFormSchema>;
