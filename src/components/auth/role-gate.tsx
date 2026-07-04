"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { canAccessRoute } from "@/lib/auth/rbac";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { useAuthStore } from "@/store/auth-store";

type RoleGateProps = {
  children: React.ReactNode;
  pathname: string;
};

export function RoleGate({ children, pathname }: RoleGateProps) {
  const user = useAuthStore((state) => state.user);
  const allowed = canAccessRoute(pathname, user?.role ?? null);

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Alert className="max-w-lg">
          <ShieldAlert />
          <AlertTitle>Access denied</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Your role ({user?.role ?? "unknown"}) does not have permission to
              view this page.
            </p>
            <Button render={<Link href={AUTH_ROUTES.dashboard} />} size="sm">
              Back to dashboard
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return children;
}
