import { z } from "zod";

export const mediaFieldValueSchema = z.object({
  file: z.custom<File | null>(),
  removeExisting: z.boolean(),
});

export type MediaFieldValueInput = z.infer<typeof mediaFieldValueSchema>;
