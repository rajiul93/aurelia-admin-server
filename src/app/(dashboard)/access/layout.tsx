import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { hasMinimumRole } from "@/lib/auth/rbac";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { mapNeonUserToAuthUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * ROUTE_ACCESS_RULES restricts /access to SUPERADMIN and ADMIN, but the proxy
 * only evaluates that rule for /dashboard* (PROTECTED_ROUTE_PREFIXES), so this
 * segment was reachable by a MANAGER typing the URL. Hiding the nav item is not
 * a boundary; the check has to run on the server for the segment itself.
 *
 * The API is guarded independently via requireStaffRole("ADMIN") — this layout
 * only spares a MANAGER a page full of failed requests.
 */
export default async function AccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await auth.getSession();
  const user = session?.user ? mapNeonUserToAuthUser(session) : null;

  if (!user || !hasMinimumRole(user.role, "ADMIN")) {
    redirect(`${AUTH_ROUTES.dashboard}?error=forbidden`);
  }

  return children;
}
