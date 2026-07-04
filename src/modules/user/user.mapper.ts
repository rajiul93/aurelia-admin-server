import type { User } from "@/generated/prisma/client";
import type { UserDto } from "./user.types";

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    age: user.age,
    email: user.email,
    countryCode: user.countryCode,
    phone: user.phone,
    language: user.language,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toUserDtoList(users: User[]): UserDto[] {
  return users.map(toUserDto);
}
