import type { StaffRole } from "./auth";

export type User = {
  id: string;
  name: string;
  age: number;
  email: string;
  countryCode: string;
  phone: string;
  language: string;
  role: StaffRole | "USER";
  createdAt: string;
  updatedAt: string;
};

export type CreateUserPayload = {
  name: string;
  age: number;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  language?: string;
  role?: string;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">>;
