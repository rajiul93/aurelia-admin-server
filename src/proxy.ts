import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  canAccessRoute,
  normalizeStaffRole,
} from "@/lib/auth/rbac";
import { canAccessDashboard } from "@/lib/auth/session";
import {
  AUTH_ROUTES,
  isAuthPage,
  isProtectedRoute,
} from "@/lib/auth/routes";

const neonMiddleware = auth.middleware({
  loginUrl: AUTH_ROUTES.login,
});

type SessionResponse = {
  user?: {
    role?: string | null;
    emailVerified?: boolean;
  };
} | null;

async function getSessionFromRequest(
  request: NextRequest,
): Promise<SessionResponse> {
  try {
    const response = await fetch(
      new URL("/api/auth/get-session", request.url),
      {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as SessionResponse;

    if (!data?.user) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);
  const isAuthenticated = Boolean(session?.user);
  const hasDashboardAccess = canAccessDashboard(session);

  if (isAuthPage(pathname)) {
    // Only bounce away from auth pages when the user can fully use the dashboard.
    // Unverified or non-staff sessions must stay on verify/login/register flows.
    if (isAuthenticated && hasDashboardAccess) {
      return NextResponse.redirect(new URL(AUTH_ROUTES.dashboard, request.url));
    }

    return NextResponse.next();
  }

  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL(AUTH_ROUTES.login, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!session?.user?.emailVerified) {
      const verifyUrl = new URL(AUTH_ROUTES.verifyEmail, request.url);
      return NextResponse.redirect(verifyUrl);
    }

    const role = normalizeStaffRole(session.user.role);

    if (!role) {
      const loginUrl = new URL(AUTH_ROUTES.login, request.url);
      loginUrl.searchParams.set("error", "staff_only");
      return NextResponse.redirect(loginUrl);
    }

    if (!canAccessRoute(pathname, role)) {
      const dashboardUrl = new URL(AUTH_ROUTES.dashboard, request.url);
      dashboardUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(dashboardUrl);
    }

    return neonMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
