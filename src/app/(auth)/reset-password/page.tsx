import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Reset password",
};

function ResetPasswordFallback() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset password"
      description="Choose a new password for your staff account."
    >
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
