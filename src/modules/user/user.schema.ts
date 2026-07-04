import { z } from "zod";
import { Language, Role } from "@/generated/prisma/client";

const roleValues = Object.values(Role) as [Role, ...Role[]];
const languageValues = Object.values(Language) as [Language, ...Language[]];

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().int().min(1).max(150),
  email: z.email(),
  countryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(1, "Phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  language: z.enum(languageValues).optional(),
  role: z.enum(roleValues).optional(),
});

export const updateUserSchema = createUserSchema
  .partial()
  .omit({ password: true });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(roleValues).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1, "User id is required"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
