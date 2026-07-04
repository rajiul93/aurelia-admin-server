import type { Language, Role } from "@/generated/prisma/client";

export type UserDto = {
  id: string;
  name: string;
  age: number;
  email: string;
  countryCode: string;
  phone: string;
  language: Language;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};
