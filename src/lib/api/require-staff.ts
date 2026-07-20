import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { auth } from "@/lib/auth/server";
import { hasMinimumRole } from "@/lib/auth/rbac";
import { mapNeonUserToAuthUser } from "@/lib/auth/session";
import type { StaffRole } from "@/types/auth";

export async function requireStaffSession() {
  const sessionResponse = await auth.getSession();

  if (!sessionResponse.data?.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required.");
  }

  const user = mapNeonUserToAuthUser(sessionResponse.data);

  if (!user) {
    throw new AppError(403, "FORBIDDEN", "Staff access required.");
  }

  return user;
}

export async function requireStaffSessionFromRequest(req: NextRequest) {
  void req;
  return requireStaffSession();
}

/**
 * Staff session plus a minimum role.
 *
 * ROUTE_ACCESS_RULES describes which roles may reach which admin area, but the
 * page-level rules alone are not a boundary — a MANAGER can skip the navigation
 * and call the API directly. Role-restricted routes must gate here, where the
 * data actually leaves the server.
 */
export async function requireStaffRole(minRole: StaffRole) {
  const user = await requireStaffSession();

  if (!hasMinimumRole(user.role, minRole)) {
    throw new AppError(
      403,
      "FORBIDDEN",
      `This action requires ${minRole} access.`,
    );
  }

  return user;
}
