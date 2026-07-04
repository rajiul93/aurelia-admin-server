export { auth } from "./server";
export { authClient } from "./client";
export { AUTH_ROUTES, isAuthPage, isProtectedRoute } from "./routes";
export {
  canAccessRoute,
  getRequiredRolesForRoute,
  hasMinimumRole,
  normalizeStaffRole,
  ROUTE_ACCESS_RULES,
  STAFF_ROLES,
} from "./rbac";
export {
  mapNeonUserToAuthUser,
  getSessionExpiry,
  canAccessDashboard,
} from "./session";
export {
  fetchAndStoreSession,
  getAccessToken,
  refreshAccessToken,
} from "./token-manager";
