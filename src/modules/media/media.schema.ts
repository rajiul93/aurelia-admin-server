import { z } from "zod";

export const mediaIdParamSchema = z.object({
  id: z.string().trim().min(1, "Media id is required"),
});

export type MediaIdParam = z.infer<typeof mediaIdParamSchema>;
