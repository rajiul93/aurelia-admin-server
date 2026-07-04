import type { StaffRole, AuthUser } from "@/types/auth";
import { normalizeStaffRole } from "./rbac";

type NeonSessionUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  emailVerified?: boolean;
};

type NeonSessionPayload = {
  user: NeonSessionUser;
  session: {
    token: string;
    expiresAt: Date | string;
  };
};

export function mapNeonUserToAuthUser(
  session: NeonSessionPayload,
): AuthUser | null {
  const role = normalizeStaffRole(session.user.role);

  if (!role) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role,
    emailVerified: Boolean(session.user.emailVerified),
  };
}

export function isStaffUser(role: StaffRole | null): role is StaffRole {
  return role !== null;
}

export function getSessionExpiry(expiresAt: Date | string) {
  return new Date(expiresAt).getTime();
}

type SessionCheckUser = {
  role?: string | null;
  emailVerified?: boolean;
};

export function canAccessDashboard(session: {
  user?: SessionCheckUser;
} | null) {
  if (!session?.user) {
    return false;
  }

  const role = normalizeStaffRole(session.user.role);

  if (!role) {
    return false;
  }

  return Boolean(session.user.emailVerified);
}
