import { auth } from "@/lib/auth/server";
import { mapNeonUserToAuthUser } from "@/lib/auth/session";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { redirect } from "next/navigation";
import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect(AUTH_ROUTES.login);
  }

  const user = mapNeonUserToAuthUser(session);

  if (!user) {
    redirect(`${AUTH_ROUTES.login}?error=staff_only`);
  }

  if (!user.emailVerified) {
    redirect(
      `${AUTH_ROUTES.verifyEmail}?email=${encodeURIComponent(user.email)}`,
    );
  }

  return (
    <DashboardShell>
      <AuthGate>{children}</AuthGate>
    </DashboardShell>
  );
}
