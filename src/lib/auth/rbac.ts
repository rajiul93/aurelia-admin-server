import type { StaffRole } from "@/types/auth";

export const STAFF_ROLES: StaffRole[] = ["SUPERADMIN", "ADMIN", "MANAGER"];

export const ROLE_HIERARCHY: Record<StaffRole, number> = {
  SUPERADMIN: 3,
  ADMIN: 2,
  MANAGER: 1,
};

type RouteAccessRule = {
  path: string;
  roles: StaffRole[];
};

export const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
  { path: "/dashboard", roles: STAFF_ROLES },
  { path: "/profile", roles: STAFF_ROLES },
  { path: "/faqs", roles: STAFF_ROLES },
  { path: "/faqs/categories", roles: STAFF_ROLES },
  { path: "/tours", roles: STAFF_ROLES },
  { path: "/access", roles: ["SUPERADMIN", "ADMIN"] },
  { path: "/app-content", roles: STAFF_ROLES },
];

export function normalizeStaffRole(
  role?: string | null,
): StaffRole | null {
  if (!role) {
    return null;
  }

  const normalized = role.toUpperCase().replace(/[-\s]/g, "");

  if (normalized === "SUPERADMIN") {
    return "SUPERADMIN";
  }

  if (normalized === "ADMIN") {
    return "ADMIN";
  }

  if (normalized === "MANAGER") {
    return "MANAGER";
  }

  return null;
}

export function hasMinimumRole(
  userRole: StaffRole,
  requiredRole: StaffRole,
) {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessRoute(pathname: string, role: StaffRole | null) {
  if (!role) {
    return false;
  }

  const rule = ROUTE_ACCESS_RULES.find(
    (entry) =>
      pathname === entry.path || pathname.startsWith(`${entry.path}/`),
  );

  if (!rule) {
    return true;
  }

  return rule.roles.includes(role);
}

export function getRequiredRolesForRoute(pathname: string): StaffRole[] | null {
  const rule = ROUTE_ACCESS_RULES.find(
    (entry) =>
      pathname === entry.path || pathname.startsWith(`${entry.path}/`),
  );

  return rule?.roles ?? null;
}
