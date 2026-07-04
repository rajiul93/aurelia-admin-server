import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { auth } from "@/lib/auth/server";
import { mapNeonUserToAuthUser } from "@/lib/auth/session";

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
