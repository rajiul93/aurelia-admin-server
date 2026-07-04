import { z } from "zod";
import { STAFF_ROLES } from "@/lib/auth/rbac";
import { mediaFieldValueSchema } from "@/schemas/media.schema";

const staffRoleValues = STAFF_ROLES as [string, ...string[]];

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  role: z.enum(staffRoleValues),
  avatar: mediaFieldValueSchema,
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
