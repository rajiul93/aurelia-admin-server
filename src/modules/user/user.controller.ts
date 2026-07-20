import type { NextRequest } from "next/server";
import {
  requireStaffRole,
  requireStaffSessionFromRequest,
} from "@/lib/api/require-staff";
import { success } from "@/lib/api/response";
import { parseBody, parseParams, parseQuery } from "@/lib/api/validate";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from "./user.schema";
import { userService } from "./user.service";

/**
 * Consumer accounts carry PII (name, age, email, phone), so every route here is
 * staff-only. Assigning a `role` is separately restricted to SUPERADMIN: staff
 * dashboard access is granted by Neon Auth rather than this column, but the
 * column still marks privilege and should not be settable by every staff member.
 */
async function requireUserRoleAssignment(role: unknown) {
  if (role === undefined) {
    return;
  }

  await requireStaffRole("SUPERADMIN");
}

export const userController = {
  async list(req: NextRequest) {
    await requireStaffSessionFromRequest(req);
    const query = parseQuery(req.nextUrl.searchParams, listUsersQuerySchema);
    const result = await userService.list(query);

    return success(result.data, { meta: result.meta });
  },

  async create(req: NextRequest) {
    await requireStaffSessionFromRequest(req);
    const body = await parseBody(req, createUserSchema);
    await requireUserRoleAssignment(body.role);
    const user = await userService.create(body);

    return success(user, { status: 201 });
  },

  async getById(req: NextRequest, id: string) {
    await requireStaffSessionFromRequest(req);
    const user = await userService.getById(id);
    return success(user);
  },

  async update(req: NextRequest, id: string) {
    await requireStaffSessionFromRequest(req);
    const body = await parseBody(req, updateUserSchema);
    await requireUserRoleAssignment(body.role);
    const user = await userService.update(id, body);

    return success(user);
  },

  async delete(_req: NextRequest, id: string) {
    await requireStaffRole("ADMIN");
    await userService.delete(id);
    return success({ deleted: true });
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, userIdParamSchema).id;
  },
};
