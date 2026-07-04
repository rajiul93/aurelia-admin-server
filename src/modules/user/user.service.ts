import bcrypt from "bcryptjs";
import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { toUserDto, toUserDtoList } from "./user.mapper";
import { userRepository } from "./user.repository";
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from "./user.schema";

const SALT_ROUNDS = 10;

export const userService = {
  async list(query: ListUsersQuery) {
    const { users, total } = await userRepository.findMany(query);

    return {
      data: toUserDtoList(users),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  },

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return toUserDto(user);
  },

  async create(input: CreateUserInput) {
    const existingEmail = await userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError("Email already in use");
    }

    const existingPhone = await userRepository.findByPhone(input.phone);
    if (existingPhone) {
      throw new ConflictError("Phone already in use");
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await userRepository.create({
      name: input.name,
      age: input.age,
      email: input.email,
      countryCode: input.countryCode,
      phone: input.phone,
      password: hashedPassword,
      language: input.language,
      role: input.role,
    });

    return toUserDto(user);
  },

  async update(id: string, input: UpdateUserInput) {
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    if (input.email) {
      const emailOwner = await userRepository.findByEmail(input.email);
      if (emailOwner && emailOwner.id !== id) {
        throw new ConflictError("Email already in use");
      }
    }

    if (input.phone) {
      const phoneOwner = await userRepository.findByPhone(input.phone);
      if (phoneOwner && phoneOwner.id !== id) {
        throw new ConflictError("Phone already in use");
      }
    }

    const user = await userRepository.update(id, input);
    return toUserDto(user);
  },

  async delete(id: string) {
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    await userRepository.delete(id);
  },
};
