import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams, parseQuery } from "@/lib/api/validate";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from "./user.schema";
import { userService } from "./user.service";

export const userController = {
  async list(req: NextRequest) {
    const query = parseQuery(req.nextUrl.searchParams, listUsersQuerySchema);
    const result = await userService.list(query);

    return success(result.data, { meta: result.meta });
  },

  async create(req: NextRequest) {
    const body = await parseBody(req, createUserSchema);
    const user = await userService.create(body);

    return success(user, { status: 201 });
  },

  async getById(id: string) {
    const user = await userService.getById(id);
    return success(user);
  },

  async update(req: NextRequest, id: string) {
    const body = await parseBody(req, updateUserSchema);
    const user = await userService.update(id, body);

    return success(user);
  },

  async delete(id: string) {
    await userService.delete(id);
    return success({ deleted: true });
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, userIdParamSchema).id;
  },
};
